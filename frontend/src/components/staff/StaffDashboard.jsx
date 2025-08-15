import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Users, Scissors, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import StaffPhotoUpload from './StaffPhotoUpload';

const API_BASE_URL = 'http://localhost:8081/api/v1';

const StaffDashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [todayStats, setTodayStats] = useState({
    appointments: 0,
    completed: 0,
    revenue: 0,
    photosUploaded: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    fetchTodayStats();
    fetchRecentAppointments();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`);
      setTodayStats({
        appointments: response.data.stats.today_appointments || 0,
        completed: response.data.stats.status_counts?.completed || 0,
        revenue: response.data.stats.today_revenue || 0,
        photosUploaded: 0 // We'll calculate this separately if needed
      });
    } catch (error) {
      console.error('Failed to fetch today stats:', error);
    }
  };

  const fetchRecentAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API_BASE_URL}/admin/appointments?date=${today}`);
      setRecentAppointments(response.data.appointments.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent appointments:', error);
    }
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

  if (activeView === 'photos') {
    return <StaffPhotoUpload onBack={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
        <p className="text-gray-600">Manage appointments and capture grooming photos</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveView('photos')}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Camera className="h-8 w-8 mb-3" />
          <h3 className="font-semibold text-lg">Upload Photos</h3>
          <p className="text-blue-100 text-sm">Before & after grooming</p>
        </button>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <Calendar className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-lg text-gray-900">Today's Schedule</h3>
          <p className="text-gray-600 text-sm">{todayStats.appointments} appointments</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <CheckCircle className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-lg text-gray-900">Completed</h3>
          <p className="text-gray-600 text-sm">{todayStats.completed} services done</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-lg text-gray-900">Today's Revenue</h3>
          <p className="text-gray-600 text-sm">${todayStats.revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Scissors className="h-5 w-5 mr-2 text-blue-600" />
            Today's Appointments
          </h2>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
            <p className="text-gray-500">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAppointments.map(appointment => (
              <div 
                key={appointment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {appointment.pet_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {appointment.pet_name} - {appointment.service_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Owner: {appointment.customer_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {appointment.appointment_time}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setActiveView('photos')}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Photos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips for Staff */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📸 Photo Tips for Great Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-1">Before Photos:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Capture the pet's condition before grooming</li>
              <li>• Show areas that need special attention</li>
              <li>• Good lighting helps show the transformation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">After Photos:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Show off your amazing grooming work!</li>
              <li>• Capture happy, clean pets</li>
              <li>• These photos help customers see the value</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;