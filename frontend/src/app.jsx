import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Home, Calendar, Clock, User, Scissors, Droplets, Star, Bell, Phone, MapPin, Plus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AdminPanel from './components/admin/AdminPanel';
import PaymentStep from './components/payment/PaymentStep';

// API Configuration
const API_BASE_URL = 'http://localhost:8081/api/v1';

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false); 

  useEffect(() => {
    // Check if user is logged in (stored in localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      const userData = response.data.user;
      
      // Set role based on email for admin access
      if (email === 'ant@test.com') {
        userData.role = 'super_admin';
      } else {
        userData.role = 'customer';
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      connectWebSocket(userData.id);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, { name, email, phone, password });
      const userData = response.data.user;
      userData.role = 'customer';
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      connectWebSocket(userData.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  const connectWebSocket = (userId) => {
    if (wsConnection) {
      wsConnection.close();
    }
    const ws = new WebSocket(`ws://localhost:8081/ws?user_id=${userId}`);
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);
    };
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    setWsConnection(ws);
  };
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Screen Component
const LoginScreen = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      console.log('Login successful, email is:', email);
      // Small delay to ensure user is set, then redirect
      setTimeout(() => {
        if (email === 'ant@test.com') {
          
          navigate('/admin');
        } else {
          
          navigate('/app');
        }
      }, 100);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="text-gray-600 mt-2">Sign in to Jake's Bath House</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Account */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Demo Accounts:</strong><br />
            Customer: ant@cheese.com / password123<br />
            Admin: ant@test.com / password123
          </p>
        </div>

        {/* Switch to Register */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-orange-600 font-semibold hover:text-orange-700"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Screen Component
const RegisterScreen = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(formData.name, formData.email, formData.phone, formData.password);
    if (result.success) {
      navigate('/app');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={onSwitchToLogin}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600">Join Jake's Bath House family</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="(561) 123-4567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                placeholder="Create a password (min 6 characters)"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-orange-600 font-semibold hover:text-orange-700"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Your original mobile app component (unchanged)
const MobileApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, logout } = useAuth();

  const [notifications] = useState([
    { id: 1, message: "Your grooming appointment is ready for pickup!", time: "10 min ago" }
  ]);

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/services`);
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Home Screen
  const HomeScreen = () => (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-b-3xl text-white mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Hey {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-orange-100">Ready to pamper your pets?</p>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="bg-white bg-opacity-20 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-2xl font-bold">{user.wash_count || 0}</p>
              <p className="text-orange-100 text-sm">Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{5 - ((user.wash_count || 0) % 5)}</p>
              <p className="text-orange-100 text-sm">More for reward</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${(user.wash_count || 0) * 15}</p>
              <p className="text-orange-100 text-sm">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Quick Book</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setCurrentView('book')}
            className="bg-gradient-to-br from-teal-500 to-cyan-500 p-4 rounded-2xl text-white flex items-center"
          >
            <Droplets className="w-8 h-8 mr-3" />
            <div className="text-left">
              <p className="font-semibold">DIY Wash</p>
              <p className="text-teal-100 text-sm">$15 • 1 hour</p>
            </div>
          </button>
          <button 
            onClick={() => setCurrentView('book')}
            className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-2xl text-white flex items-center"
          >
            <Scissors className="w-8 h-8 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Grooming</p>
              <p className="text-orange-100 text-sm">From $45</p>
            </div>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="px-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Notifications</h3>
          {notifications.map(notif => (
            <div key={notif.id} className="bg-green-50 border border-green-200 rounded-xl p-4 mb-2">
              <div className="flex items-start">
                <div className="bg-green-500 w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-green-800 font-medium">{notif.message}</p>
                  <p className="text-green-600 text-sm mt-1">{notif.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Book Screen (keeping your original 4-step booking)
  const BookScreen = () => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    const [pets, setPets] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      fetchUserPets();
    }, []);

    const fetchUserPets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${user.id}/pets`);
        setPets(response.data.pets || []);
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      }
    };

    const getAvailableTimeSlots = () => {
      if (!selectedService) return [];
      
      if (selectedService.type === 'groom') {
        return [
          '9:00 AM', '10:00 AM', '11:00 AM', 
          '12:00 PM', '1:00 PM', '2:00 PM', 
          '3:00 PM', '4:00 PM', '5:00 PM'
        ];
      } else {
        return [
          '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
          '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', 
          '4:00 PM', '5:00 PM', '6:00 PM'
        ];
      }
    };

    const handleBookingSubmit = async () => {
      setSubmitting(true);
      
      try {
        const bookingData = {
          user_id: user.id,
          pet_id: selectedPet.id,
          service_id: selectedService.id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          notes: notes
        };

        await axios.post(`${API_BASE_URL}/appointments`, bookingData);
        
        alert(`🎉 Booking confirmed for ${selectedPet.name}!\n\n${selectedService.name}\n${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`);
        
        resetBookingForm();
        setCurrentView('appointments');
        
      } catch (error) {
        console.error('Booking failed:', error);
        alert('Booking failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    const resetBookingForm = () => {
      setStep(1);
      setSelectedService(null);
      setSelectedPet(null);
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    };

    // Step 1: Select Service
    if (step === 1) {
      return (
        <div className="pb-20 p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Service</h2>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              services.map(service => (
                <div 
                  key={service.id} 
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {service.type === 'groom' ? (
                        <div className="bg-amber-100 p-3 rounded-full mr-4">
                          <Scissors className="w-6 h-6 text-amber-600" />
                        </div>
                      ) : (
                        <div className="bg-teal-100 p-3 rounded-full mr-4">
                          <Droplets className="w-6 h-6 text-teal-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">{service.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {service.type === 'groom' ? 'Professional grooming by appointment' : 'Self-service wash station'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">${service.price}</p>
                      <p className="text-sm text-gray-500">{service.duration_minutes} min</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // Step 2: Select Pet
    if (step === 2) {
      return (
        <div className="pb-20 p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setStep(1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Choose Your Pet</h2>
              <p className="text-gray-600">Who's getting pampered today?</p>
            </div>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🐕</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No pets found</h3>
              <p className="text-gray-500 mb-4">You need to add a pet before booking</p>
              <button
                onClick={() => setCurrentView('pets')}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Add Your Pet First
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pets.map(pet => (
                <div 
                  key={pet.id}
                  onClick={() => {
                    setSelectedPet(pet);
                    setStep(3);
                  }}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">
                        {pet.size === 'large' ? '🐕' : pet.size === 'small' ? '🐶' : '🐕‍🦺'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{pet.name}</h3>
                      <p className="text-gray-600">{pet.breed || 'Mixed breed'}</p>
                    </div>
                    <span className="text-orange-500 text-xl">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Step 3: Select Date and Time
    if (step === 3) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minDate = tomorrow.toISOString().split('T')[0];

      return (
        <div className="pb-20 p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setStep(2)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Pick Date & Time</h2>
              <p className="text-gray-600">When should we expect {selectedPet?.name}?</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min={minDate}
                required
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                <div className="grid grid-cols-3 gap-2">
                  {getAvailableTimeSlots().map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 text-sm rounded-lg border transition-all ${
                        selectedTime === time 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Any special instructions..."
                  rows="3"
                />
              </div>
            )}

            {selectedTime && (
              <button
                onClick={() => setStep(4)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-lg font-semibold text-lg"
              >
                Continue to Payment
              </button>
            )}
          </div>
        </div>
      );
    }

    // Step 4: Payment
    if (step === 4) {
      return (
        <PaymentStep
          selectedService={selectedService}
          selectedPet={selectedPet}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          userId={user.id}
          onPaymentSuccess={(paymentResult) => {
            // Payment successful - show success message and redirect
            alert(`🎉 Payment successful! Booking confirmed for ${selectedPet?.name}!\n\n${selectedService?.name}\n${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}\n\nPayment ID: ${paymentResult.paymentIntentId}`);
            resetBookingForm();
            setCurrentView('appointments');
          }}
          onBack={() => setStep(3)}
        />
      );
    }

    // Step 5: Confirm Booking (for DIY services that don't require payment)
    if (step === 5) {
      return (
        <div className="pb-20 p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setStep(3)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Confirm Your Booking</h2>
              <p className="text-gray-600">Review the details below</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold">🎉 Almost Ready!</h3>
              <p className="text-orange-100">One click away from pampering {selectedPet?.name}</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-orange-100">Service:</span>
                <span className="font-semibold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-100">Pet:</span>
                <span className="font-semibold">{selectedPet?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-100">Date:</span>
                <span className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-100">Time:</span>
                <span className="font-semibold">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-white border-opacity-30 pt-3">
                <span className="text-orange-100">Total:</span>
                <span className="font-bold text-2xl">${selectedService?.price}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleBookingSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Creating Booking...' : 'CONFIRM BOOKING 🎉'}
            </button>
            
            <button
              onClick={resetBookingForm}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      );
    }
  };

  // Appointments Screen (keeping your original)
  const AppointmentsScreen = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
      fetchRealAppointments();
    }, []);

    const fetchRealAppointments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${user.id}/appointments`);
        setAppointments(response.data.appointments || []);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    const updateAppointmentStatus = async (appointmentId, newStatus) => {
      try {
        await axios.put(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
          status: newStatus
        });
        
        await fetchRealAppointments();
        
        const statusMessages = {
          'in_progress': 'Appointment marked as in progress!',
          'completed': 'Appointment completed! 🎉',
          'cancelled': 'Appointment cancelled.'
        };
        alert(statusMessages[newStatus] || 'Status updated!');
        
      } catch (error) {
        console.error('Failed to update appointment:', error);
        alert('Failed to update appointment status.');
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

    const getStatusIcon = (status) => {
      switch (status) {
        case 'confirmed': return '📋';
        case 'in_progress': return '🔄';
        case 'completed': return '✅';
        case 'cancelled': return '❌';
        default: return '📋';
      }
    };

    const getServiceIcon = (serviceType) => {
      return serviceType === 'groom' ? 
        <Scissors className="w-5 h-5 text-amber-500" /> : 
        <Droplets className="w-5 h-5 text-teal-500" />;
    };

    const filteredAppointments = appointments.filter(apt => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'upcoming') return apt.status === 'confirmed' || apt.status === 'in_progress';
      if (selectedFilter === 'completed') return apt.status === 'completed';
      return true;
    });

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

    return (
      <div className="pb-20">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
            <button
              onClick={() => setCurrentView('book')}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              + Book New
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            {[
              { key: 'all', label: 'All', count: appointments.length },
              { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress').length },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === key 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {selectedFilter === 'all' ? 'No appointments yet' : `No ${selectedFilter} appointments`}
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedFilter === 'all' 
                  ? 'Book your first appointment to get started!' 
                  : `No ${selectedFilter} appointments found.`
                }
              </p>
              {selectedFilter === 'all' && (
                <button
                  onClick={() => setCurrentView('book')}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Book First Appointment
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  {/* Appointment Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-3 rounded-full mr-4">
                        {getServiceIcon(apt.service_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{apt.pet_name}</h3>
                        <p className="text-gray-600">{apt.service_name}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                        {getStatusIcon(apt.status)} {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">{formatDate(apt.appointment_date)}</span>
                      <Clock className="w-4 h-4 ml-4 mr-2" />
                      <span>{apt.appointment_time}</span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Booked {new Date(apt.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Special Notes */}
                  {apt.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">📝 Special Notes:</h4>
                      <p className="text-blue-700 text-sm">{apt.notes}</p>
                    </div>
                  )}

                  {/* Status-specific content */}
                  {apt.status === 'confirmed' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-blue-800 text-sm font-medium">
                        🗓️ Your appointment is confirmed! We'll see {apt.pet_name} soon.
                      </p>
                    </div>
                  )}

                  {apt.status === 'in_progress' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-yellow-800 text-sm font-medium">
                        🔄 {apt.pet_name} is being pampered right now! We'll notify you when complete.
                      </p>
                    </div>
                  )}

                  {apt.status === 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ {apt.pet_name} is all clean and ready for pickup! Thanks for choosing Jake's Bath House.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons (for demo - in real app, only Jake's team would see these) */}
                  {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                    <div className="flex space-x-2 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 mr-2">Staff Actions:</span>
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}
                          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                          Start Service
                        </button>
                      )}
                      {apt.status === 'in_progress' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Pet Management Screen (keeping your original)
  const PetManagementScreen = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
      fetchPets();
    }, []);

    const fetchPets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${user.id}/pets`);
        setPets(response.data.pets || []);
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleAddPet = async (petData) => {
      try {
        await axios.post(`${API_BASE_URL}/pets`, {
          ...petData,
          user_id: user.id
        });
        
        await fetchPets();
        setShowAddForm(false);
        
        alert(`🎉 ${petData.name} has been added to your pets!`);
      } catch (error) {
        console.error('Failed to add pet:', error);
        alert('Failed to add pet. Please try again.');
      }
    };

    const handleDeletePet = async (petId, petName) => {
      if (window.confirm(`Are you sure you want to remove ${petName} from your pets?`)) {
        try {
          await axios.delete(`${API_BASE_URL}/pets/${petId}`);
          await fetchPets();
          alert(`${petName} has been removed from your pets.`);
        } catch (error) {
          console.error('Failed to delete pet:', error);
          alert('Failed to remove pet. Please try again.');
        }
      }
    };

    if (showAddForm) {
      return <AddPetForm onSubmit={handleAddPet} onCancel={() => setShowAddForm(false)} />;
    }

    return (
      <div className="pb-20 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Pets</h2>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full flex items-center hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pet
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your furry friends...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐕</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No pets yet</h3>
            <p className="text-gray-500 mb-6">Add your first furry family member to start booking appointments</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map(pet => (
              <div key={pet.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="bg-orange-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">
                        {pet.size === 'large' ? '🐕' : pet.size === 'small' ? '🐶' : '🐕‍🦺'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{pet.name}</h3>
                      <p className="text-gray-600">{pet.breed || 'Mixed breed'}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {pet.size || 'Size not specified'}
                        </span>
                      </div>
                      {pet.notes && (
                        <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-2 rounded italic">
                          "{pet.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeletePet(pet.id, pet.name)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={`Remove ${pet.name}`}
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              <Plus className="w-6 h-6 mx-auto mb-2" />
              <span className="font-medium">Add Another Pet</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Add Pet Form Component
  const AddPetForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: '',
      breed: '',
      size: '',
      notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        alert('Pet name is required!');
        return;
      }
      
      setIsSubmitting(true);
      await onSubmit(formData);
      setIsSubmitting(false);
    };

    return (
      <div className="pb-20 p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={onCancel}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Add New Pet</h2>
            <p className="text-gray-600">Tell us about your furry friend</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
              placeholder="e.g., Buddy, Luna, Max, Bella"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Breed
            </label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="e.g., Golden Retriever, Labrador, Mixed breed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select size</option>
              <option value="small">🐶 Small (under 25 lbs)</option>
              <option value="medium">🐕‍🦺 Medium (25-60 lbs)</option>
              <option value="large">🐕 Large (over 60 lbs)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Any special care instructions, behavioral notes, allergies, etc."
              rows="4"
            />
            <p className="text-xs text-gray-500 mt-1">
              This helps our groomers provide the best care for your pet
            </p>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Adding Pet...' : '🐕 Add Pet'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Profile Screen (keeping your original)
  const ProfileScreen = () => (
    <div className="pb-20">
      <div className="p-4">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-30 w-16 h-16 rounded-full flex items-center justify-center mr-4">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-orange-100">{user.phone}</p>
              <p className="text-orange-100 text-sm">{user.email}</p>
              <div className="flex items-center mt-1">
                <Star className="w-4 h-4 mr-1" />
                <span className="text-sm">Loyal Customer</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Rewards Progress</h3>
            <Star className="w-6 h-6" />
          </div>
          <div className="mb-3">
            <div className="text-3xl font-bold">{user.wash_count || 0} visits</div>
            <p className="text-purple-100">{5 - ((user.wash_count || 0) % 5)} more visits until free wash!</p>
          </div>
          <div className="bg-white bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((user.wash_count || 0) % 5) * 20}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={logout}
            className="w-full bg-red-50 hover:bg-red-100 rounded-xl p-4 flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-red-600">Sign Out</span>
            <span className="text-red-400">›</span>
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 text-orange-600 mr-2" />
            <span className="font-semibold">Jake's Bath House</span>
          </div>
          <p className="text-gray-600 text-sm mb-2">606 Royal Palm Beach Blvd</p>
          <p className="text-gray-600 text-sm mb-2">Royal Palm Beach, FL 33411</p>
          <p className="text-orange-600 font-medium">(561) 812-3931</p>
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch(currentView) {
      case 'home': return <HomeScreen />;
      case 'book': return <BookScreen />;
      case 'appointments': return <AppointmentsScreen />;
      case 'pets': return <PetManagementScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      <div className="pt-4">
        {renderScreen()}
      </div>

      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          {[
            { key: 'home', icon: Home, label: 'Home' },
            { key: 'book', icon: Plus, label: 'Book' },
            { key: 'appointments', icon: Clock, label: 'Visits' },
            { key: 'pets', icon: User, label: 'Pets' },
            { key: 'profile', icon: User, label: 'Profile' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                currentView === key 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Auth Screen Router Component
const AuthScreenRouter = () => {
  const [authView, setAuthView] = useState('login');
  
  if (authView === 'register') {
    return <RegisterScreen onSwitchToLogin={() => setAuthView('login')} />;
  }
  return <LoginScreen onSwitchToRegister={() => setAuthView('register')} />;
};

// Main App Component with Routing
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Jake's Bath House...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={!user ? <AuthScreenRouter /> : <Navigate to="/app" replace />} />
      <Route path="/register" element={!user ? <AuthScreenRouter /> : <Navigate to="/app" replace />} />
      
      {/* Main Mobile App */}
      <Route path="/app" element={user ? <MobileApp /> : <Navigate to="/login" replace />} />
      
      {/* Admin Panel - Only for super_admin */}
      <Route 
        path="/admin" 
        element={
          user && user.role === 'super_admin' ? 
            <AdminPanel /> : 
            user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* Default redirects */}
      <Route path="/" element={
        user ? 
          (user.role === 'super_admin' ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />) :
          <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App with Auth Provider and Router
function AppWithAuth() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

export default AppWithAuth;