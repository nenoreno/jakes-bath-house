import React, { useState, useEffect } from 'react';
import { Users, Shield, Settings, Calendar, DollarSign, BarChart3, UserCheck, Lock, Eye, Edit, Trash2, Plus, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser] = useState({
    id: 1,
    name: 'ant',
    email: 'anthony@jakesbathhouse.com',
    role: 'super_admin',
    permissions: ['all']
  });

  // Mock data
  const [users, setUsers] = useState([
    { id: 1, name: 'Jake (Owner)', email: 'jake@bathhouse.com', role: 'manager', status: 'active', lastLogin: '2025-08-07 09:30' },
    { id: 2, name: 'Sarah (Groomer)', email: 'sarah@bathhouse.com', role: 'staff', status: 'active', lastLogin: '2025-08-07 08:15' },
    { id: 3, name: 'Mike (Assistant)', email: 'mike@bathhouse.com', role: 'viewer', status: 'active', lastLogin: '2025-08-06 16:45' },
    { id: 4, name: 'Lisa (Part-time)', email: 'lisa@bathhouse.com', role: 'viewer', status: 'inactive', lastLogin: '2025-08-05 14:20' }
  ]);

  const [appointments] = useState([
    { id: 1, customer: 'John Doe', pet: 'Buddy (Golden Retriever)', service: 'Full Grooming', date: '2025-08-07', time: '10:00', status: 'confirmed', revenue: 85 },
    { id: 2, customer: 'Jane Smith', pet: 'Whiskers (Persian Cat)', service: 'Bath & Brush', date: '2025-08-07', time: '14:30', status: 'in_progress', revenue: 45 },
    { id: 3, customer: 'Bob Wilson', pet: 'Rex (German Shepherd)', service: 'Nail Trim', date: '2025-08-08', time: '09:00', status: 'pending', revenue: 25 }
  ]);

  const rolePermissions = {
    super_admin: {
      label: 'Super Admin',
      color: 'bg-red-500',
      permissions: [
        'system_settings', 'user_management', 'role_management', 'financial_reports',
        'appointment_management', 'customer_management', 'service_management',
        'analytics', 'backup_restore', 'audit_logs', 'all_data_access'
      ]
    },
    manager: {
      label: 'Manager',
      color: 'bg-blue-500',
      permissions: [
        'staff_management', 'appointment_management', 'customer_management',
        'service_management', 'financial_reports', 'analytics', 'business_settings'
      ]
    },
    staff: {
      label: 'Staff',
      color: 'bg-green-500',
      permissions: [
        'appointment_management', 'customer_service', 'pet_management',
        'basic_reports', 'schedule_view'
      ]
    },
    viewer: {
      label: 'Viewer',
      color: 'bg-gray-500',
      permissions: [
        'schedule_view', 'customer_lookup', 'basic_reports'
      ]
    }
  };

  const hasPermission = (permission) => {
    if (currentUser.role === 'super_admin') return true;
    return rolePermissions[currentUser.role]?.permissions.includes(permission);
  };

  const PermissionGate = ({ permission, children, fallback = null }) => {
    return hasPermission(permission) ? children : fallback;
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, permission }) => (
    <PermissionGate permission={permission}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </PermissionGate>
  );

  const UserRow = ({ user }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              {user.name.charAt(0)}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${rolePermissions[user.role].color}`}>
          {rolePermissions[user.role].label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.lastLogin}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <PermissionGate permission="user_management">
          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
            <Edit className="h-4 w-4" />
          </button>
          <button className="text-red-600 hover:text-red-900">
            <Trash2 className="h-4 w-4" />
          </button>
        </PermissionGate>
      </td>
    </tr>
  );

  const RolePermissionMatrix = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions Matrix</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Permission</th>
              {Object.entries(rolePermissions).map(([roleKey, role]) => (
                <th key={roleKey} className="text-center py-2 px-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${role.color}`}>
                    {role.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              'System Settings', 'User Management', 'Financial Reports', 'Appointment Management',
              'Customer Management', 'Service Management', 'Analytics', 'Staff Management',
              'Business Settings', 'Schedule View', 'Basic Reports'
            ].map((permission) => (
              <tr key={permission} className="border-t">
                <td className="py-2 px-4 text-sm text-gray-700">{permission}</td>
                {Object.entries(rolePermissions).map(([roleKey, role]) => (
                  <td key={roleKey} className="text-center py-2 px-4">
                    {roleKey === 'super_admin' || role.permissions.some(p => 
                      p.toLowerCase().replace(/_/g, ' ') === permission.toLowerCase()
                    ) ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 rounded-full mx-auto"></div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, permission: 'analytics' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, permission: 'appointment_management' },
    { id: 'users', label: 'User Management', icon: Users, permission: 'user_management' },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, permission: 'role_management' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'system_settings' }
  ];

  const visibleTabs = tabs.filter(tab => hasPermission(tab.permission));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Jake's Bath House Admin</h1>
              <span className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full text-white ${rolePermissions[currentUser.role].color}`}>
                {rolePermissions[currentUser.role].label}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {currentUser.name}</span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 py-4">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Today's Revenue"
                value="$340"
                icon={DollarSign}
                color="bg-green-500"
                trend={12}
                permission="financial_reports"
              />
              <StatCard
                title="Appointments Today"
                value="8"
                icon={Calendar}
                color="bg-blue-500"
                trend={5}
                permission="appointment_management"
              />
              <StatCard
                title="Active Staff"
                value="4"
                icon={Users}
                color="bg-purple-500"
                permission="staff_management"
              />
              <StatCard
                title="System Health"
                value="99.9%"
                icon={Shield}
                color="bg-indigo-500"
                permission="system_settings"
              />
            </div>

            <PermissionGate permission="appointment_management">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appointments.map(appointment => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.customer}</div>
                            <div className="text-sm text-gray-500">{appointment.pet}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{appointment.service}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{appointment.date} at {appointment.time}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">${appointment.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </PermissionGate>
          </div>
        )}

        {activeTab === 'users' && (
          <PermissionGate permission="user_management">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>

              <div className="bg-white shadow-sm rounded-lg border">
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          className="pl-10 pr-4 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <button className="flex items-center px-3 py-2 border rounded-md text-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </button>
                    </div>
                  </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => <UserRow key={user.id} user={user} />)}
                  </tbody>
                </table>
              </div>
            </div>
          </PermissionGate>
        )}

        {activeTab === 'roles' && (
          <PermissionGate permission="role_management">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
              <RolePermissionMatrix />
              
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(rolePermissions).map(([roleKey, role]) => (
                  <div key={roleKey} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white mr-3 ${role.color}`}>
                          {role.label}
                        </span>
                      </h3>
                      <PermissionGate permission="role_management">
                        <button className="text-indigo-600 hover:text-indigo-700">
                          <Edit className="h-4 w-4" />
                        </button>
                      </PermissionGate>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {roleKey === 'super_admin' ? (
                          <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            All Permissions
                          </span>
                        ) : (
                          role.permissions.map(permission => (
                            <span key={permission} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                              {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PermissionGate>
        )}

        {activeTab === 'settings' && (
          <PermissionGate permission="system_settings">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                      <button className="bg-green-500 text-white px-3 py-1 rounded text-xs">Enabled</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Session Timeout</span>
                      <span className="text-sm text-gray-500">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Password Policy</span>
                      <button className="text-indigo-600 text-sm">Configure</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Business Hours</span>
                      <button className="text-indigo-600 text-sm">Edit</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Service Pricing</span>
                      <button className="text-indigo-600 text-sm">Manage</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Notification Settings</span>
                      <button className="text-indigo-600 text-sm">Configure</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PermissionGate>
        )}

        {/* Access Denied Message */}
        {!hasPermission(tabs.find(t => t.id === activeTab)?.permission || 'analytics') && (
          <div className="text-center py-12">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to view this section.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;