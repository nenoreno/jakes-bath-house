import React, { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, Clock, User, Calendar, Scissors, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/v1';

const StaffPhotoUpload = ({ onBack }) => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [photoType, setPhotoType] = useState('before_groom');
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  const fetchTodaysAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API_BASE_URL}/admin/appointments?date=${today}`);
      
      // Filter for confirmed appointments that aren't cancelled
      const activeAppointments = response.data.appointments.filter(
        apt => apt.status === 'confirmed' || apt.status === 'in_progress'
      );
      
      setAppointments(activeAppointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!selectedAppointment || !file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('pet_id', selectedAppointment.pet_id);
      formData.append('caption', caption || getDefaultCaption());
      formData.append('photo_type', photoType);

      // Add appointment ID for staff uploads
      formData.append('appointment_id', selectedAppointment.id);

      const response = await axios.post(`${API_BASE_URL}/pets/${selectedAppointment.pet_id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedPhotos(prev => [...prev, {
        type: photoType,
        url: response.data.photo_url,
        caption: caption || getDefaultCaption()
      }]);

      setCaption('');
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getDefaultCaption = () => {
    if (!selectedAppointment) return '';
    
    const petName = selectedAppointment.pet_name;
    const serviceName = selectedAppointment.service_name;
    
    if (photoType === 'before_groom') {
      return `${petName} before ${serviceName} - ready for spa day!`;
    } else {
      return `${petName} after ${serviceName} - looking absolutely stunning!`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center">
          <Camera className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Photo Upload</h1>
            <p className="text-gray-600">Capture before & after grooming photos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Appointment Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Today's Appointments
          </h2>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appointment => (
                <div
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAppointment?.id === appointment.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium">{appointment.customer_name}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Scissors className="h-3 w-3 mr-2" />
                      <span>{appointment.pet_name} - {appointment.service_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-2" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Photo Upload */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-green-600" />
            Upload Photos
          </h2>

          {!selectedAppointment ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select an appointment to upload photos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Appointment Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">
                  {selectedAppointment.pet_name} - {selectedAppointment.service_name}
                </h3>
                <p className="text-blue-700 text-sm">
                  Owner: {selectedAppointment.customer_name}
                </p>
              </div>

              {/* Photo Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPhotoType('before_groom')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      photoType === 'before_groom'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    📷 Before Grooming
                  </button>
                  <button
                    onClick={() => setPhotoType('after_groom')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      photoType === 'after_groom'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    ✨ After Grooming
                  </button>
                </div>
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={getDefaultCaption()}
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handlePhotoUpload(e.target.files[0])}
                  disabled={uploading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {uploading && (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading photo...</p>
                </div>
              )}

              {/* Uploaded Photos Summary */}
              {uploadedPhotos.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Photos Uploaded for {selectedAppointment.pet_name}:
                  </h4>
                  <div className="space-y-1">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="flex items-center text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{photo.type === 'before_groom' ? 'Before' : 'After'}: {photo.caption}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPhotoUpload;