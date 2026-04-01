import React, { useState } from "react";
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Monitor, 
  Smartphone, 
  Mail, 
  Phone, 
  // MapPin, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Settings as SettingsIcon,
  ChevronRight,
  Moon,
  Sun,
  // Volume2,
  Download,
  Trash2
} from "lucide-react";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  // const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [language, setLanguage] = useState("en");

  const settingsTabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "language", label: "Language & Region", icon: Globe },
    { id: "data", label: "Data & Storage", icon: Download },
  ];

  return (
    <div className="space-y-6">
      {/* Under Construction Watermark */}
      <div className="absolute inset-0 bg-gray-50/30 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-8 shadow-lg transform -rotate-2">
            <h2 className="text-3xl font-bold text-purple-800 mb-2">⚙️ UNDER CONSTRUCTION ⚙️</h2>
            <p className="text-purple-700 text-lg">Settings panel coming soon!</p>
            <p className="text-purple-600 text-sm mt-2">We're building comprehensive customization options</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <SettingsIcon className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                </div>

                {/* Profile Photo */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                      JD
                    </div>
                    <div className="flex-1">
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Camera className="w-4 h-4" />
                        Change Photo
                      </button>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="john.doe@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+250 788 123 456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      defaultValue="1990-05-15"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Kigali City</option>
                      <option>Northern Province</option>
                      <option>Southern Province</option>
                      <option>Eastern Province</option>
                      <option>Western Province</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Gasabo District</option>
                      <option>Kicukiro District</option>
                      <option>Nyarugenge District</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Kimironko Sector</option>
                      <option>Remera Sector</option>
                      <option>Kacyiru Sector</option>
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    rows={4}
                    defaultValue="Community health worker passionate about improving healthcare access in rural communities. Certified in maternal health and child nutrition."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Bell className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Browser and mobile push notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-600">Text message alerts for important updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Notification Categories */}
                  <div className="mt-8">
                    <h3 className="font-medium text-gray-900 mb-4">Notification Categories</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Course Updates", desc: "New courses and content updates", checked: true },
                        { label: "Assignment Reminders", desc: "Deadline and submission reminders", checked: true },
                        { label: "Certificates", desc: "Certificate completion notifications", checked: true },
                        { label: "System Updates", desc: "Platform maintenance and updates", checked: false },
                        { label: "Marketing", desc: "Promotional content and offers", checked: false },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={item.checked}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Security & Privacy</h2>
                </div>

                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Lock className="w-4 h-4" />
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={twoFactorAuth}
                          onChange={(e) => setTwoFactorAuth(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {twoFactorAuth && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">Two-factor authentication is enabled. You'll receive a code via SMS when logging in.</p>
                      </div>
                    )}
                  </div>

                  {/* Login Sessions */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      {[
                        { device: "Chrome on Windows", location: "Kigali, Rwanda", current: true, time: "Now" },
                        { device: "Safari on iPhone", location: "Kigali, Rwanda", current: false, time: "2 hours ago" },
                        { device: "Firefox on Ubuntu", location: "Kigali, Rwanda", current: false, time: "1 day ago" },
                      ].map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">{session.device}</p>
                              <p className="text-sm text-gray-600">{session.location} • {session.time}</p>
                            </div>
                          </div>
                          {session.current ? (
                            <span className="text-sm text-green-600 font-medium">Current Session</span>
                          ) : (
                            <button className="text-sm text-red-600 hover:text-red-800">Revoke</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Palette className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Appearance Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sun className="w-4 h-4" />
                          <span className="font-medium">Light</span>
                        </div>
                        <div className="w-full h-16 bg-white border rounded"></div>
                      </div>
                      <div className="border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <Moon className="w-4 h-4" />
                          <span className="font-medium">Dark</span>
                        </div>
                        <div className="w-full h-16 bg-gray-800 border rounded"></div>
                      </div>
                      <div className="border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="w-4 h-4" />
                          <span className="font-medium">Auto</span>
                        </div>
                        <div className="w-full h-16 bg-gradient-to-r from-white to-gray-800 border rounded"></div>
                      </div>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Font Size</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Small</span>
                      <input type="range" min="12" max="18" defaultValue="14" className="flex-1" />
                      <span className="text-lg">Large</span>
                    </div>
                  </div>

                  {/* Color Accent */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Accent Color</h3>
                    <div className="flex gap-3">
                      {["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", "bg-yellow-500", "bg-pink-500"].map((color, index) => (
                        <button
                          key={index}
                          className={`w-8 h-8 rounded-full ${color} ${index === 0 ? 'ring-2 ring-gray-400' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Language Settings */}
            {activeTab === "language" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Globe className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Language & Region</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="rw">Kinyarwanda</option>
                      <option value="fr">Français</option>
                      <option value="sw">Kiswahili</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>(UTC+02:00) Africa/Kigali</option>
                      <option>(UTC+00:00) UTC</option>
                      <option>(UTC+01:00) Europe/London</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Storage Settings */}
            {activeTab === "data" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Download className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Data & Storage</h2>
                </div>

                <div className="space-y-6">
                  {/* Storage Usage */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Storage Usage</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Course Materials</span>
                        <span className="text-sm font-medium">2.4 GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Certificates</span>
                        <span className="text-sm font-medium">124 MB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cache</span>
                        <span className="text-sm font-medium">89 MB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "10%" }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Data Export */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
                    <p className="text-sm text-gray-600 mb-4">Download all your data including progress, certificates, and profile information</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Download className="w-4 h-4" />
                      Download My Data
                    </button>
                  </div>

                  {/* Clear Cache */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Clear Cache</h3>
                    <p className="text-sm text-gray-600 mb-4">Remove cached files to free up storage space</p>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <RefreshCw className="w-4 h-4" />
                      Clear Cache
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
