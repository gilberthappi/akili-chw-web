import React, { useEffect, useState } from "react";
import TopBar from "@/components/navigation/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigationFilter, type NavLink } from "@/hooks/useNavigationFilter";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cog8ToothIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  Award,
  BarChart3,
  Calendar,
  GraduationCap,
  Building2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Users,
  UsersRound,
  Video,
  KanbanSquare,
  ClipboardList,
  LineChart,
  FileText,
  Activity,
  Headset,
  Plug,
  KeyRound,
  Map,
  Network,
  Target,
  FolderOpen,
  Image,
  BookOpen,
  History,
  LayoutTemplate,
  ListTodo,
  UserSearch,
  Sparkles,
} from "lucide-react";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { postHeartbeat } from "@/services/activity.service";
import {
  APP_SHELL_ROLES,
  CEHO_ONLY,
  COLLAB_ROLES,
  COURSE_MGMT_ROLES,
  FIELD_LEARNER_ROLES,
  HEALTH_CENTER_ROLES,
  LEARNER_MGMT_ROLES,
  MEETING_ROLES,
  STAFF_MGMT_ROLES,
} from "@/utils/roles";
import {
  isDepartmentStaffUser,
  navItemsForRoles,
} from "@/utils/departmentNav";

const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

const NAV_ICONS: Record<string, JSX.Element> = {
  "/kanban-board": <KanbanSquare className="w-5 h-5" />,
  "/interventions": <ClipboardList className="w-5 h-5" />,
  "/briefings": <FileText className="w-5 h-5" />,
  "/platform-health": <Activity className="w-5 h-5" />,
  "/support-desk": <Headset className="w-5 h-5" />,
  "/integrations": <Plug className="w-5 h-5" />,
  "/access-grants": <KeyRound className="w-5 h-5" />,
  "/documents": <FolderOpen className="w-5 h-5" />,
  "/dictionary": <BookOpen className="w-5 h-5" />,
  "/resources": <Image className="w-5 h-5" />,
  "/tasks": <ListTodo className="w-5 h-5" />,
  "/templates": <LayoutTemplate className="w-5 h-5" />,
  "/version-history": <History className="w-5 h-5" />,
  "/coverage": <Map className="w-5 h-5" />,
  "/ceho-network": <Network className="w-5 h-5" />,
  "/campaigns": <Target className="w-5 h-5" />,
  "/user-lookup": <Users className="w-4 h-4" />,
  "/demographics/learners": <LineChart className="w-5 h-5" />,
  "/analytics": <BarChart3 className="w-5 h-5" />,
  "/announcement": <Megaphone className="w-5 h-5" />,
  "/chw": <Users className="w-4 h-4" />,
  "/testers": <UserSearch className="w-4 h-4" />,
  "/chw-registry": <ClipboardList className="w-4 h-4" />,
  "/certificates": <Award className="w-4 h-4" />,
  "/certificates/issued": <Award className="w-4 h-4" />,
  "/calender": <Calendar className="w-5 h-5" />,
  "/messaging": <MessageSquare className="w-4 h-4" />,
  "/staff": <UsersRound className="w-4 h-4" />,
  "/healthCenters": <Building2 className="w-5 h-5" />,
  "/recordings": <Video className="w-5 h-5" />,
  "/settings": <Cog8ToothIcon className="w-5 h-5" />,
  "/courses": <ClipboardDocumentListIcon className="w-5 h-5" />,
  "/courses/slide-studio": <Sparkles className="w-5 h-5 text-indigo-500" />,
  "/feedbacks": <MessageCircle className="w-4 h-4" />,
  "/meetings": <Video className="w-5 h-5" />,
};

const AdminSidebar = ({
  links,
  onToggle,
  user,
}: {
  links: NavLink[];
  onToggle?: (collapsed: boolean) => void;
  user?: {
    fullNames?: string;
    email?: string;
    roles?: string | string[];
  } | null;
}) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    // Always expand on mobile, collapse based on screen size on desktop
    return window.innerWidth < 768 ? true : window.innerWidth > 750;
  });
  const { photoUrl } = useProfilePhoto();
  const { data: unreadCounts } = useUnreadCounts();
  const totalUnread = unreadCounts?.totalUnread || 0;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // track nested open state for submenu category items (e.g. Financial / Physical)
  const [openNested, setOpenNested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onResize = () => {
      const large = window.innerWidth > 750;
      const isMobile = window.innerWidth < 768;
      // On mobile, always keep sidebar expanded when visible
      setIsExpanded(isMobile ? true : large);
      if (onToggle) onToggle(!large);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onToggle]);

  const toggleExpand = () => {
    // Don't allow collapse on mobile
    if (window.innerWidth < 768) return;
    
    setIsExpanded((s) => {
      const next = !s;
      if (onToggle) onToggle(!next);
      if (!next) setOpenDropdown(null);
      return next;
    });
  };

  const toggleNested = (key: string) => {
    setOpenNested((prev) => {
      const isOpen = !!prev[key];
      if (isOpen) {
        // if currently open, close it
        return {};
      }
      // open this key and close all others (accordion behavior)
      return { [key]: true };
    });
  };

  // Find the single deepest matching path among all links so only the most specific item is active
  const findDeepestMatch = (items: NavLink[]): string | null => {
    let best: string | null = null;
    for (const it of items) {
      if (it.path) {
        if (location.pathname === it.path || location.pathname.startsWith(it.path)) {
          if (!best || it.path.length > best.length) best = it.path;
        }
      }
      if (it.submenus && it.submenus.length > 0) {
        const childBest = findDeepestMatch(it.submenus);
        if (childBest && (!best || childBest.length > best.length)) best = childBest;
      }
    }
    return best;
  };

  const activePath = findDeepestMatch(links);

  const isPathActive = (p?: string) => {
    if (!p) return false;
    return activePath === p;
  };

  // Auto-open top-level parent when one of its descendants is active so the active item is visible
  useEffect(() => {
    if (!isExpanded || !activePath) return;
    // find top-level link label that contains the activePath
    const top = links.find((l) => {
      if (l.path && l.path === activePath) return true;
      // search recursively
      const stack: NavLink[] = [...(l.submenus ?? [])];
      while (stack.length) {
        const cur = stack.shift()!;
        if (cur.path === activePath) return true;
        if (cur.submenus) stack.push(...cur.submenus);
      }
      return false;
    });

    if (top) {
      setOpenDropdown(top.label);
    }
  }, [activePath, isExpanded, links]);

  return (
    <aside
      className={`h-screen overflow-hidden flex flex-col shadow-lg transition-all ${
        isExpanded ? "w-52 md:w-52" : "w-20"
      }`}
    >
      <div className='shrink-0 p-6 bg-gradient-to-r from-primary to-primary/90 flex items-center justify-between'>
        <div className={`${isExpanded ? "w-80" : "w-6"} transition-all`}>
          <Link to='/' className='flex items-center gap-3'>
            <div
              className={`${
                isExpanded ? "w-10 h-10" : "w-6 h-6"
              } bg-white border-2 border-primary-light rounded-full flex items-center justify-center shadow-sm`}
            >
              <img
                src='/chw.png'
                alt='eBumenyi'
                className={`${isExpanded ? "w-20 h-20" : "w-8 h-8"} object-contain`}
              />
            </div>
            {isExpanded && <div className='text-white font-semibold'>eBumenyi</div>}
          </Link>
        </div>

        <button
          type='button'
          onClick={toggleExpand}
          className='p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors hidden md:block'
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronDownIcon className='w-4 h-4 text-white rotate-90' />
          ) : (
            <ChevronDownIcon className='w-2 h-2 text-white -rotate-90' />
          )}
        </button>
      </div>

      <nav className='flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 px-1 [scrollbar-width:thin] [scrollbar-color:rgba(51,99,173,0.35)_transparent]'>
        <ul className='flex flex-col space-y-1'>
          {links.map((link) => {
            const hasSub = Array.isArray(link.submenus) && link.submenus.length > 0;
            return (
              <li key={link.label} className='relative'>
                {hasSub ? (
                  <>
                    <button
                      type='button'
                      onClick={() =>
                        setOpenDropdown((prev) =>
                          prev === link.label ? null : link.label,
                        )
                      }
                      className={`${
                        isPathActive(link.path)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      } w-full rounded-lg transition-colors duration-200 flex items-center justify-between py-2.5 px-4`}
                    >
                      <div className='flex items-center space-x-3'>
                        <span className='w-5 flex-shrink-0 text-gray-600'>
                          {link.icon}
                        </span>
                        {isExpanded && <span className='text-sm'>{link.label}</span>}
                      </div>
                      {isExpanded && (
                        <motion.span
                          animate={{ rotate: openDropdown === link.label ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <ChevronDownIcon className='w-4 h-4' />
                        </motion.span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && openDropdown === link.label && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className='overflow-hidden ml-4 mt-1 space-y-1'
                        >
                          {link.submenus!.map((s) => (
                            <li key={s.label}>
                              {s.submenus && s.submenus.length > 0 ? (
                                <>
                                  <button
                                    type='button'
                                    onClick={() =>
                                      toggleNested(`${link.label}-${s.label}`)
                                    }
                                    className={`${
                                      isPathActive(s.path)
                                        ? "text-primary border-l-2 border-primary pl-[14px]"
                                        : "text-gray-600 hover:bg-gray-100 pl-4"
                                    } w-full rounded-lg flex items-center justify-between space-x-3 py-2 transition-colors duration-200 text-sm`}
                                  >
                                    <div className='flex items-center space-x-3'>
                                      <span className='w-4 h-4'>{s.icon}</span>
                                      <span>{s.label}</span>
                                    </div>
                                    <motion.span
                                      animate={{
                                        rotate: openNested[
                                          `${link.label}-${s.label}`
                                        ]
                                          ? 180
                                          : 0,
                                      }}
                                      transition={{ duration: 0.18 }}
                                    >
                                      <ChevronDownIcon className='w-4 h-4' />
                                    </motion.span>
                                  </button>

                                  <AnimatePresence>
                                    {openNested[`${link.label}-${s.label}`] && (
                                      <motion.ul
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className='ml-4 mt-1 space-y-1 overflow-hidden'
                                      >
                                        {s.submenus!.map((child) => (
                                          <li key={child.label}>
                                            <Link
                                              to={child.path || "/"}
                                              className={`${
                                                isPathActive(child.path)
                                                  ? "text-primary border-l-2 border-primary pl-[14px]"
                                                  : "text-gray-600 hover:bg-gray-100 pl-4"
                                              } rounded-lg flex items-center space-x-3 py-2 transition-colors duration-200 text-sm`}
                                            >
                                              <span className='w-4 h-4'>
                                                {child.icon}
                                              </span>
                                              <span>{child.label}</span>
                                            </Link>
                                          </li>
                                        ))}
                                      </motion.ul>
                                    )}
                                  </AnimatePresence>
                                </>
                              ) : (
                                <Link
                                  to={s.path || "/"}
                                  className={`${
                                    isPathActive(s.path)
                                      ? "text-primary border-l-2 border-primary pl-[14px]"
                                      : "text-gray-600 hover:bg-gray-100 pl-4"
                                  } rounded-lg flex items-center space-x-3 py-2 transition-colors duration-200 text-sm`}
                                >
                                  <span
                                    className={`w-4 h-4 ${
                                      isPathActive(s.path) ? "text-primary" : ""
                                    }`}
                                  >
                                    {s.icon}
                                  </span>
                                  <span>{s.label}</span>
                                </Link>
                              )}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={link.path || "/"}
                    className={`${
                      isPathActive(link.path)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    } rounded-lg flex items-center space-x-3 py-2.5 px-4 transition-colors duration-200 group`}
                  >
                    <span className='relative w-5 flex-shrink-0 text-gray-600'>
                      {link.icon}
                      {!isExpanded && link.label === "Messaging" && totalUnread > 0 && (
                        <span className='absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] leading-none font-bold text-white'>
                          {totalUnread}
                        </span>
                      )}
                    </span>
                    {isExpanded && (
                      <span className='text-sm flex items-center gap-2'>
                        {link.label}
                        {link.label === "Messaging" && totalUnread > 0 && (
                          <span className='min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] leading-none font-bold text-white'>
                            {totalUnread}
                          </span>
                        )}
                      </span>
                    )}
                    {!isExpanded && (
                      <div className='absolute left-20 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                        {link.label}
                      </div>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className='shrink-0 border-t border-gray-200 p-4 bg-gray-50'>
        {isExpanded ? (
          <div className='flex items-center space-x-3'>
            <div className='flex-shrink-0'>
              <ProfileAvatar
                name={`${user?.fullNames || "User"}}`}
                size='w-8 h-8'
                photo={photoUrl || undefined}
                rounded={true}
              />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-sm font-medium text-gray-900 truncate' title={user?.fullNames}>
                {user?.fullNames}
              </span>
              <span className='text-xs text-gray-500 truncate' title={user?.email ?? "user@example.com"}>
                {user?.email ?? "user@example.com"}
              </span>
            </div>
          </div>
        ) : (
          <div className='flex justify-center'>
            <div className='bg-primary w-6 h-6 rounded-full flex items-center justify-center text-white font-medium'>
              {user?.fullNames?.charAt(0)  ?? "U"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const DashboardLayout = ({
  children,
  onSidebarToggle,
  mainClassName,
}: {
  children: React.ReactNode;
  onSidebarToggle?: (collapsed: boolean) => void;
  mainClassName?: string;
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarVisible(false);
    }
  }, [location.pathname]);

  // Session-duration heartbeat — fire-and-forget telemetry, never blocks the UI.
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = () => {
      const courseMatch = location.pathname.match(/^\/learn\/([^/]+)/);
      void postHeartbeat(courseMatch?.[1]);
    };

    sendHeartbeat();
    const id = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
     
  }, [user, location.pathname]);

  const handleSidebarToggle = (collapsed: boolean) => {
    if (onSidebarToggle) onSidebarToggle(collapsed);
  };

  // Get industry-specific configuration
  const userRolesList: string[] = user?.roles
    ? Array.isArray(user.roles)
      ? (user.roles as string[])
      : [user.roles as string]
    : [];
  const isDeptStaff = isDepartmentStaffUser(userRolesList);

  const legacySidebarLinks: NavLink[] = [
    {
      label: "Dashboard",
      path: "/",
      roles: [...APP_SHELL_ROLES],
      icon: <Squares2X2Icon className='w-5 h-5' />,
    },
    {
      label: "Staff",
      icon: <UsersRound className='w-4 h-4' />,
      path: "/staff",
      roles: [...STAFF_MGMT_ROLES],
    },
    {
      label: "Health Centers",
      path: "/healthCenters",
      roles: [...HEALTH_CENTER_ROLES],
      icon: <Building2 className='w-5 h-5' />,
    },
    {
      label: "Courses",
      path: "/courses",
      // Role-only: legacy ADMIN (and other course managers) may lack department/industry
      // on the auth payload — do not hide Courses behind an industry gate.
      roles: [...COURSE_MGMT_ROLES],
      icon: <ClipboardDocumentListIcon className='w-5 h-5' />,
    },
    {
      label: "Slide Studio",
      path: "/courses/slide-studio",
      roles: [...COURSE_MGMT_ROLES],
      icon: <Sparkles className='w-5 h-5 text-indigo-500' />,
    },
    {
      label: "My Learning",
      icon: <GraduationCap className='w-4 h-4' />,
      path: "/my-learning",
      roles: [...FIELD_LEARNER_ROLES],
    },
    {
      label: "My Group",
      icon: <UsersRound className='w-4 h-4' />,
      path: "/ceho-group",
      roles: [...CEHO_ONLY],
    },
    {
      label: "CHW & CEHO",
      icon: <Users className='w-4 h-4' />,
      path: "/chw",
      roles: [...LEARNER_MGMT_ROLES],
    },
    {
      label: "CHW Registry",
      icon: <ClipboardList className='w-4 h-4' />,
      path: "/chw-registry",
      roles: ["ADMIN"],
    },
    {
      label: "My Certificates",
      icon: <Award className='w-4 h-4' />,
      path: "/my-certificates",
      roles: [...FIELD_LEARNER_ROLES],
    },
    {
      label: "Certificates",
      icon: <Award className='w-4 h-4' />,
      path: "/certificates",
      roles: [...LEARNER_MGMT_ROLES],
    },
    {
      label: "Feedbacks",
      icon: <MessageCircle className='w-4 h-4' />,
      path: "/feedbacks",
      roles: [...LEARNER_MGMT_ROLES],
    },
    {
      label: "Calender",
      path: "/calender",
      roles: [...COLLAB_ROLES],
      icon: <Calendar className='w-5 h-5' />,
    },
    {
      label: "Meetings",
      path: "/meetings",
      roles: [...MEETING_ROLES],
      icon: <Video className='w-5 h-5' />,
    },
    {
      label: "Messaging",
      icon: <MessageSquare className='w-4 h-4' />,
      path: "/messaging",
      roles: [...COLLAB_ROLES],
    },
    {
      label: "Announcement",
      path: "/announcement",
      roles: [...COURSE_MGMT_ROLES],
      icon: <Megaphone className='w-5 h-5' />,
    },
    {
      label: "My Settings",
      path: "/settings",
      roles: [...APP_SHELL_ROLES],
      icon: <Cog8ToothIcon className='w-5 h-5' />,
    },
  ];

  const departmentSidebarLinks: NavLink[] = [
    {
      label: "Dashboard",
      path: "/",
      roles: [...APP_SHELL_ROLES],
      icon: <Squares2X2Icon className='w-5 h-5' />,
    },
    ...navItemsForRoles(userRolesList).map((item) => ({
      label: item.label,
      path: item.path,
      roles: item.roles,
      icon: NAV_ICONS[item.path] ?? <Squares2X2Icon className='w-5 h-5' />,
    })),
    {
      label: "Messaging",
      path: "/messaging",
      roles: [...APP_SHELL_ROLES],
      icon: <MessageSquare className='w-4 h-4' />,
    },
    {
      label: "My Settings",
      path: "/settings",
      roles: [...APP_SHELL_ROLES],
      icon: <Cog8ToothIcon className='w-5 h-5' />,
    },
  ];

  const sidebarLinks: NavLink[] = isDeptStaff
    ? departmentSidebarLinks
    : legacySidebarLinks;
  // Use the navigation filter hook to filter links based on permissions
  const filteredLinks = useNavigationFilter(sidebarLinks);

  return (
    <div className='flex h-screen'>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform ${
          isSidebarVisible ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:relative md:translate-x-0 bg-white shadow-xl`}
      >
        <AdminSidebar
          links={filteredLinks}
          onToggle={handleSidebarToggle}
          user={user}
        />
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col transition-all h-screen overflow-hidden'>
        <TopBar onMenuClick={() => setSidebarVisible((s) => !s)} />
        <main className={mainClassName ?? 'flex-1 p-4 overflow-y-auto bg-white'}>{children}</main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarVisible && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden'
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* The AI assistant FAB is fixed to the same viewport corner as the message
          composer's send button — keep it off the Messaging page to avoid overlap. */}
      {!location.pathname.startsWith("/messaging") && <ChatWidget />}
    </div>
  );
};

export default DashboardLayout;
