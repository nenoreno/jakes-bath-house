import React, { useState, useEffect } from 'react';
import { Users, Shield, Settings, Calendar, DollarSign, BarChart3, UserCheck, Lock, Eye, Edit, Trash2, Plus, Search, Filter, ChevronDown, ChevronRight, Clock, Scissors, Droplets, AlertTriangle, CheckCircle, RefreshCw, Play, Pause, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/v1';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser] = useState({
    id: 1,
    name: 'ant',
    email: 'anthony@jakesbathhouse.com',
    role: 'super_admin',
    permissions: ['all']
  });
  
  // Real-time data state
  const [realTimeAppointments, setRealTimeAppointments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    today_revenue: 0,
    today_appointments: 0,
    total_customers: 0,
    status_counts: {}
  });
  const [customers, setCustomers] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Real admin users data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [businessSettings, setBusinessSettings] = useState([]);
  const [settingsCategories, setSettingsCategories] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingSettings, setEditingSettings] = useState({});
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  
  // Real-time data fetching
  useEffect(() => {
    fetchDashboardData();
    connectWebSocket();
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);
  
  useEffect(() => {
    fetchAppointments();
  }, [appointmentFilter, dateFilter]);
  
  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8081/ws?user_id=${currentUser.id}`);
    
    ws.onopen = () => {
      console.log('Admin WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Admin WebSocket message:', message);
      
      if (message.type === 'appointment_update') {
        // Refresh appointments and stats when updates come in
        fetchAppointments();
        fetchDashboardStats();
      }
    };
    
    ws.onclose = () => {
      console.log('Admin WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    setWsConnection(ws);
  };
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchAppointments(),
        fetchCustomers(),
        fetchAdminUsers(),
        fetchRoles(),
        fetchBusinessSettings()
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`);
      setDashboardStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };
  
  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (appointmentFilter !== 'all') {
        params.append('status', appointmentFilter);
      }
      if (dateFilter) {
        params.append('date', dateFilter);
      }
      
      const response = await axios.get(`${API_BASE_URL}/admin/appointments?${params}`);
      setRealTimeAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };
  
  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/customers`);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };
  
  const fetchAdminUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    }
  };
  
  const fetchRoles = async () => {
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/roles`),
        axios.get(`${API_BASE_URL}/admin/permissions`)
      ]);
      setRoles(rolesResponse.data.roles || []);
      setAvailablePermissions(permissionsResponse.data.permissions || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };
  
  const fetchBusinessSettings = async () => {
    try {
      const [settingsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/settings`),
        axios.get(`${API_BASE_URL}/admin/settings/categories`)
      ]);
      setBusinessSettings(settingsResponse.data.settings || []);
      setSettingsCategories(categoriesResponse.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch business settings:', error);
    }
  };
  
  const createAdminUser = async (userData) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/users`, userData);
      await fetchAdminUsers();
      setShowAddUserModal(false);
      alert('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };
  
  const updateAdminUser = async (userId, userData) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/users/${userId}`, userData);
      await fetchAdminUsers();
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };
  
  const deactivateAdminUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/users/${userId}`);
        await fetchAdminUsers();
        alert('User deactivated successfully!');
      } catch (error) {
        console.error('Failed to deactivate user:', error);
        alert(error.response?.data?.error || 'Failed to deactivate user');
      }
    }
  };
  
  const updateBusinessSetting = async (category, key, value) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/settings/${category}/${key}`, {
        setting_value: value
      });
      await fetchBusinessSettings();
      alert('Setting updated successfully!');
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting');
    }
  };
  
  const updateRolePermissions = async (roleId, permissions) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
        permissions: permissions
      });
      await fetchRoles();
      alert('Role permissions updated successfully!');
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      alert(error.response?.data?.error || 'Failed to update role permissions');
    }
  };
  
  const createRole = async (roleData) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/roles`, roleData);
      await fetchRoles();
      setShowAddRoleModal(false);
      alert('Role created successfully!');
    } catch (error) {
      console.error('Failed to create role:', error);
      alert(error.response?.data?.error || 'Failed to create role');
    }
  };
  
  const deleteRole = async (roleId, roleName) => {
    if (window.confirm(`Are you sure you want to delete the ${roleName} role?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/roles/${roleId}`);
        await fetchRoles();
        alert('Role deleted successfully!');
      } catch (error) {
        console.error('Failed to delete role:', error);
        alert(error.response?.data?.error || 'Failed to delete role');
      }
    }
  };
  
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      
      // Update will come via WebSocket, but also refresh locally for immediate feedback
      fetchAppointments();
      fetchDashboardStats();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    }
  };

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

  const StatCard = ({ title, value, icon: Icon, color, trend, permission, isLive = false }) => (
    <PermissionGate permission={permission}>
      <div className="bg-white rounded-lg shadow-sm border p-6 relative">
        {isLive && (
          <div className="absolute top-2 right-2 flex items-center">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-xs text-gray-500 ml-1">LIVE</span>
          </div>
        )}
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

  const InteractivePermissionMatrix = () => {
    const togglePermission = (roleId, roleName, permission, hasPermission) => {
      if (roleName === 'super_admin') {
        alert('Cannot modify super admin permissions');
        return;
      }
      
      const role = roles.find(r => r.id === roleId);
      if (!role) return;
      
      let newPermissions;
      if (hasPermission) {
        newPermissions = role.permissions.filter(p => p !== permission);
      } else {
        newPermissions = [...role.permissions, permission];
      }
      
      updateRolePermissions(roleId, newPermissions);
    };
    
    const getPermissionsByCategory = () => {
      const categories = {};
      availablePermissions.forEach(perm => {
        if (!categories[perm.category]) {
          categories[perm.category] = [];
        }
        categories[perm.category].push(perm);
      });
      return categories;
    };
    
    const permissionCategories = getPermissionsByCategory();
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Interactive Permissions Matrix</h3>
          <button
            onClick={() => setShowAddRoleModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Role
          </button>
        </div>
        
        <div className="space-y-6">
          {Object.entries(permissionCategories).map(([category, permissions]) => (
            <div key={category} className="">
              <h4 className="text-md font-medium text-gray-800 mb-3 capitalize">
                {category} Permissions
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-700 w-64">Permission</th>
                      {roles.map(role => (
                        <th key={role.id} className="text-center py-2 px-3">
                          <div className="flex flex-col items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${role.color} mb-1`}>
                              {role.display_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {users.filter(user => user.role === role.name).length} users
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map(permission => (
                      <tr key={permission.name} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700">{permission.display}</div>
                            <div className="text-xs text-gray-500">{permission.name}</div>
                          </div>
                        </td>
                        {roles.map(role => {
                          const hasPermission = role.name === 'super_admin' || 
                            (role.permissions && role.permissions.includes(permission.name));
                          const isEditable = role.name !== 'super_admin';
                          
                          return (
                            <td key={role.id} className="text-center py-3 px-3">
                              <button
                                onClick={() => isEditable && togglePermission(role.id, role.name, permission.name, hasPermission)}
                                disabled={!isEditable}
                                className={`w-6 h-6 rounded-full mx-auto transition-all ${
                                  hasPermission 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-gray-300 hover:bg-gray-400'
                                } ${
                                  isEditable ? 'cursor-pointer' : 'cursor-not-allowed'
                                }`}
                                title={`${
                                  isEditable 
                                    ? hasPermission ? 'Click to remove permission' : 'Click to grant permission'
                                    : 'Super admin permissions cannot be modified'
                                }`}
                              >
                                {hasPermission && (
                                  <CheckCircle className="w-4 h-4 text-white m-0.5" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">How to use:</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Click green circles to remove permissions</li>
                <li>• Click gray circles to grant permissions</li>
                <li>• Super Admin permissions cannot be modified</li>
                <li>• Create custom roles with specific permission sets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <Calendar className="w-4 h-4" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  
  const getServiceIcon = (serviceType) => {
    return serviceType === 'groom' ? 
      <Scissors className="w-5 h-5 text-amber-500" /> : 
      <Droplets className="w-5 h-5 text-teal-500" />;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, permission: 'analytics' },
    { id: 'appointments', label: 'Live Appointments', icon: Calendar, permission: 'appointment_management' },
    { id: 'customers', label: 'Customers', icon: Users, permission: 'customer_management' },
    { id: 'users', label: 'User Management', icon: Users, permission: 'user_management' },
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
                value={`$${dashboardStats.today_revenue.toFixed(2)}`}
                icon={DollarSign}
                color="bg-green-500"
                permission="financial_reports"
                isLive={true}
              />
              <StatCard
                title="Appointments Today"
                value={dashboardStats.today_appointments.toString()}
                icon={Calendar}
                color="bg-blue-500"
                permission="appointment_management"
                isLive={true}
              />
              <StatCard
                title="Total Customers"
                value={dashboardStats.total_customers.toString()}
                icon={Users}
                color="bg-purple-500"
                permission="customer_management"
              />
              <StatCard
                title="WebSocket Status"
                value={isConnected ? "Connected" : "Disconnected"}
                icon={isConnected ? CheckCircle : AlertTriangle}
                color={isConnected ? "bg-green-500" : "bg-red-500"}
                permission="system_settings"
              />
            </div>
            
            {/* Status Overview */}
            <PermissionGate permission="appointment_management">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(dashboardStats.status_counts).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status)} mb-2`}>
                        {getStatusIcon(status)}
                        <span className="ml-2 capitalize">{status.replace('_', ' ')}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </PermissionGate>

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {realTimeAppointments.slice(0, 5).map(appointment => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.customer_name}</div>
                            <div className="text-sm text-gray-500">{appointment.pet_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getServiceIcon(appointment.service_type)}
                              <span className="ml-2 text-sm text-gray-900">{appointment.service_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1 capitalize">{appointment.status.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {appointment.payment_id ? (
                              <div className="text-xs">
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  appointment.payment_status === 'succeeded' ? 'bg-green-100 text-green-800' :
                                  appointment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {appointment.payment_status === 'succeeded' ? '💳' : 
                                   appointment.payment_status === 'pending' ? '⏳' : '❌'}
                                  <span className="ml-1">${appointment.amount_paid?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="text-gray-500 mt-1">
                                  {appointment.payment_type === 'deposit' ? 'Deposit' : 'Full'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">No payment</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-1">
                              {appointment.status === 'confirmed' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                  title="Start Service"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                              )}
                              {appointment.status === 'in_progress' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                  title="Mark Complete"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </button>
                              )}
                              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </PermissionGate>
          </div>
        )}

        {activeTab === 'appointments' && (
          <PermissionGate permission="appointment_management">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  Live Appointment Management
                  <div className={`ml-3 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                </h2>
                <button 
                  onClick={fetchAppointments}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                    <select
                      value={appointmentFilter}
                      onChange={(e) => setAppointmentFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setAppointmentFilter('all');
                        setDateFilter(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Appointments List */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">
                    Appointments ({realTimeAppointments.length})
                  </h3>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading appointments...</p>
                  </div>
                ) : realTimeAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                    <p className="text-gray-500">No appointments match your current filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer & Pet</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {realTimeAppointments.map(appointment => (
                          <tr key={appointment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{appointment.customer_name}</div>
                                <div className="text-sm text-gray-500">{appointment.customer_email}</div>
                                <div className="text-sm font-medium text-indigo-600">{appointment.pet_name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {getServiceIcon(appointment.service_type)}
                                <div className="ml-2">
                                  <div className="text-sm font-medium text-gray-900">{appointment.service_name}</div>
                                  <div className="text-sm text-gray-500 capitalize">{appointment.service_type}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{formatDate(appointment.appointment_date)}</div>
                                <div className="text-gray-500">{appointment.appointment_time}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-2 capitalize">{appointment.status.replace('_', ' ')}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {appointment.payment_id ? (
                                <div className="text-sm">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    appointment.payment_status === 'succeeded' ? 'bg-green-100 text-green-800' :
                                    appointment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {appointment.payment_status === 'succeeded' ? '💳' : 
                                     appointment.payment_status === 'pending' ? '⏳' : '❌'}
                                    <span className="ml-1 font-semibold">${appointment.amount_paid?.toFixed(2) || '0.00'}</span>
                                  </div>
                                  <div className="text-gray-500 text-xs mt-1">
                                    {appointment.payment_type === 'deposit' ? 'Deposit paid' : 'Paid in full'}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">
                                  <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    No payment
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                {appointment.status === 'confirmed' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                                    className="inline-flex items-center px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                    title="Start Service"
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Start
                                  </button>
                                )}
                                {appointment.status === 'in_progress' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                    className="inline-flex items-center px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    title="Mark Complete"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Complete
                                  </button>
                                )}
                                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                    className="inline-flex items-center px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    title="Cancel Appointment"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {appointment.notes && (
                                <div className="text-xs text-gray-600 max-w-xs truncate" title={appointment.notes}>
                                  {appointment.notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </PermissionGate>
        )}
        
        {activeTab === 'customers' && (
          <PermissionGate permission="customer_management">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
                <button 
                  onClick={fetchCustomers}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              <div className="bg-white shadow-sm rounded-lg border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Customer List ({customers.length})</h3>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading customers...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pets</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Appointments</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Since</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map(customer => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-indigo-800">
                                      {customer.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                  <div className="text-sm text-gray-500">ID: {customer.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{customer.email}</div>
                              <div className="text-sm text-gray-500">{customer.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {customer.pet_count} pet{customer.pet_count !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{customer.wash_count}</div>
                              <div className="text-xs text-gray-500">
                                {5 - (customer.wash_count % 5)} more for reward
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {customer.appointment_count}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {new Date(customer.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </PermissionGate>
        )}

        {activeTab === 'users' && (
          <PermissionGate permission="user_management">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowRoleManagement(!showRoleManagement)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-purple-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {showRoleManagement ? 'Hide' : 'Manage'} Roles
                  </button>
                  <button 
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                </div>
              </div>
              
              {/* Role Management Section */}
              {showRoleManagement && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Role & Permission Management</h3>
                    <button
                      onClick={() => setShowAddRoleModal(true)}
                      className="bg-indigo-600 text-white px-3 py-2 rounded-md flex items-center hover:bg-indigo-700 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Custom Role
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Available Roles</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {roles.map(role => (
                        <div key={role.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${role.color}`}>
                              {role.display_name}
                            </span>
                            {role.name !== 'super_admin' && role.name !== 'manager' && role.name !== 'staff' && role.name !== 'viewer' && (
                              <button
                                onClick={() => deleteRole(role.id, role.display_name)}
                                className="text-red-500 hover:text-red-700 text-xs"
                                title="Delete custom role"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          <div className="text-xs text-gray-500">
                            {users.filter(user => user.role === role.name).length} user(s)
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {role.permissions?.length || 0} permissions
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <InteractivePermissionMatrix />
                </div>
              )}

              <div className="bg-white shadow-sm rounded-lg border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Admin & Staff ({users.length})</h3>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hired Date</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-indigo-800">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                                user.role === 'super_admin' ? 'bg-red-500' :
                                user.role === 'manager' ? 'bg-blue-500' :
                                user.role === 'staff' ? 'bg-green-500' : 'bg-gray-500'
                              }`}>
                                {user.role.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.user_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.user_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.hired_date ? new Date(user.hired_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => setEditingUser(user)}
                                  className="text-indigo-600 hover:text-indigo-900 p-1"
                                  title="Edit User"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                {user.role !== 'super_admin' && (
                                  <button 
                                    onClick={() => deactivateAdminUser(user.user_id, user.name)}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Deactivate User"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </PermissionGate>
        )}


        {activeTab === 'settings' && (
          <PermissionGate permission="system_settings">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Business Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure key business settings. Additional options will appear as new features are added.
                  </p>
                </div>
                <button 
                  onClick={fetchBusinessSettings}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading settings...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {settingsCategories
                    .filter(category => category !== 'business_hours') // Hide business hours
                    .sort((a, b) => {
                      // Sort categories by priority: business, payment, security, notifications
                      const order = ['business', 'payment', 'security', 'notifications'];
                      return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(category => {
                    const categorySettings = businessSettings.filter(setting => setting.category === category);
                    return (
                      <div key={category} className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-4 border-b">
                          <h3 className="text-lg font-medium text-gray-900 capitalize">
                            {category.replace('_', ' ')} Settings
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {categorySettings.length > 0 ? categorySettings.map(setting => (
                              <div key={setting.id} className="flex items-center justify-between py-2">
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-gray-700 capitalize">
                                    {setting.setting_key.replace('_', ' ')}
                                  </label>
                                  {setting.description && (
                                    <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                                  )}
                                </div>
                                <div className="ml-4">
                                  {setting.data_type === 'boolean' ? (
                                    <button
                                      onClick={() => updateBusinessSetting(
                                        setting.category, 
                                        setting.setting_key, 
                                        setting.setting_value === 'true' ? 'false' : 'true'
                                      )}
                                      className={`px-3 py-1 rounded text-xs font-medium ${
                                        setting.setting_value === 'true' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {setting.setting_value === 'true' ? 'Enabled' : 'Disabled'}
                                    </button>
                                  ) : setting.data_type === 'json' ? (
                                    <span className="text-sm text-gray-600">
                                      {JSON.parse(setting.setting_value).start} - {JSON.parse(setting.setting_value).end}
                                    </span>
                                  ) : (
                                    <input
                                      type={setting.data_type === 'number' ? 'number' : 'text'}
                                      value={editingSettings[setting.id] !== undefined ? editingSettings[setting.id] : setting.setting_value}
                                      onChange={(e) => setEditingSettings({
                                        ...editingSettings,
                                        [setting.id]: e.target.value
                                      })}
                                      onBlur={() => {
                                        if (editingSettings[setting.id] !== undefined && editingSettings[setting.id] !== setting.setting_value) {
                                          updateBusinessSetting(setting.category, setting.setting_key, editingSettings[setting.id]);
                                        }
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.target.blur();
                                        }
                                      }}
                                      className="px-3 py-1 text-sm border border-gray-300 rounded-md w-32"
                                    />
                                  )}
                                </div>
                              </div>
                            )) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">
                                  No settings available in this category. Settings will appear here as features are added.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
        
        {/* Connection Status Footer */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}></div>
            <span>{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal 
          onClose={() => setShowAddUserModal(false)}
          onSubmit={createAdminUser}
          roles={roles}
        />
      )}
      
      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(userData) => updateAdminUser(editingUser.user_id, userData)}
          roles={roles}
        />
      )}
      
      {/* Add Role Modal */}
      {showAddRoleModal && (
        <AddRoleModal
          onClose={() => setShowAddRoleModal(false)}
          onSubmit={createRole}
          availablePermissions={availablePermissions}
        />
      )}
    </div>
  );
};

// Add User Modal Component
const AddUserModal = ({ onClose, onSubmit, roles }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    hired_date: new Date().toISOString().split('T')[0],
    salary: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      hired_date: formData.hired_date || null
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {roles.map(role => (
                <option key={role.name} value={role.name}>{role.display_name}</option>
              ))}
            </select>
            
            {/* Show selected role permissions */}
            {formData.role && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {roles.find(r => r.name === formData.role)?.display_name} Permissions:
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.role === 'super_admin' ? (
                    <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      All Permissions
                    </span>
                  ) : (
                    (roles.find(r => r.name === formData.role)?.permissions || []).map(permission => (
                      <span key={permission} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component  
const EditUserModal = ({ user, onClose, onSubmit, roles }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'staff',
    status: user.user_status || 'active',
    hired_date: user.hired_date ? new Date(user.hired_date).toISOString().split('T')[0] : '',
    salary: user.salary || '',
    notes: user.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      hired_date: formData.hired_date || null
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={user.role === 'super_admin'}
            >
              {roles.map(role => (
                <option key={role.name} value={role.name}>{role.display_name}</option>
              ))}
            </select>
            
            {/* Show selected role permissions */}
            {formData.role && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {roles.find(r => r.name === formData.role)?.display_name} Permissions:
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.role === 'super_admin' ? (
                    <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      All Permissions
                    </span>
                  ) : (
                    (roles.find(r => r.name === formData.role)?.permissions || []).map(permission => (
                      <span key={permission} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={user.role === 'super_admin'}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Role Modal Component
const AddRoleModal = ({ onClose, onSubmit, availablePermissions }) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    color: 'bg-purple-500'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePermission = (permissionName) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  const getPermissionsByCategory = () => {
    const categories = {};
    availablePermissions.forEach(perm => {
      if (!categories[perm.category]) {
        categories[perm.category] = [];
      }
      categories[perm.category].push(perm);
    });
    return categories;
  };

  const permissionCategories = getPermissionsByCategory();
  const colorOptions = [
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-blue-500', 
    'bg-teal-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-orange-500', 'bg-rose-500'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create Custom Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., senior_groomer"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Senior Groomer"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe what this role does..."
              rows="2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex space-x-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  className={`w-8 h-8 rounded-full ${color} ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-4">
              {Object.entries(permissionCategories).map(([category, permissions]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 capitalize">{category} Permissions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map(permission => (
                      <label key={permission.name} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.name)}
                          onChange={() => togglePermission(permission.name)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{permission.display}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={!formData.name || !formData.display_name}
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;