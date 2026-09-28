import StudentsList from "@/components/students/StudentList";
import StudentStatsCards from "@/components/students/StudentStatsCards";
import CreateLearnerButton from "@/components/students/CreateLearnerButton";
import { V2PageHeader } from "@/components/v2/V2Page";
import { V2_PAGE_CANVAS } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { useAuth } from "@/hooks/useAuth";
import { TESTER_WRITE_ROLES } from "@/utils/roles";

const TestersPage = () => {
  const { hasRole } = useAuth();
  const canManageTesters = hasRole(TESTER_WRITE_ROLES);

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title="Testers"
        subtitle="Manage testers validating courses before they reach CHWs"
        actions={canManageTesters && <CreateLearnerButton role="TESTER" />}
      />

      <StudentStatsCards roleFilter="TESTER" />
      <StudentsList hideHeader={true} roleFilter="TESTER" />
    </div>
  );
};

export default TestersPage;
