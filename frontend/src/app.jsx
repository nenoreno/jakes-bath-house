import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { Home, Calendar, Clock, User, Scissors, Droplets, Star, Bell, Phone, MapPin, Plus, Eye, EyeOff, ArrowLeft } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, { name, email, phone, password });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

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
            <strong>Demo Account:</strong><br />
            Email: ant@test.com<br />
            Password: password123
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
    if (!result.success) {
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

// Main App Component (Updated with Auth)
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const [notifications] = useState([
    { id: 1, message: "Your grooming appointment is ready for pickup!", time: "10 min ago" }
  ]);

  const [appointments] = useState([
    { id: 1, petName: "Buddy", service: "Professional Grooming", date: "Today", time: "2:00 PM", status: "in-progress" },
    { id: 2, petName: "Luna", service: "DIY Wash", date: "Tomorrow", time: "10:00 AM", status: "confirmed" }
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

  // If user is not logged in, show auth screens
  if (!user) {
    if (authView === 'register') {
      return <RegisterScreen onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Home Screen (now with real user data)
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
              <p className="text-2xl font-bold">{user.wash_count}</p>
              <p className="text-orange-100 text-sm">Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{5 - (user.wash_count % 5)}</p>
              <p className="text-orange-100 text-sm">More for reward</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${user.wash_count * 15}</p>
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

      {/* Rest of the home screen content... */}
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

  // Book Screen
  const BookScreen = () => (
    <div className="pb-20">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Book Service</h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            services.map(service => (
              <div key={service.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
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
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <button className={`px-6 py-2 rounded-full font-semibold text-white ${
                    service.type === 'groom' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                  }`}>
                    Select
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Profile Screen (Updated with real user data and logout)
  const ProfileScreen = () => (
    <div className="pb-20">
      <div className="p-4">
        {/* Profile Header */}
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

        {/* Rewards Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Rewards Progress</h3>
            <Star className="w-6 h-6" />
          </div>
          <div className="mb-3">
            <div className="text-3xl font-bold">{user.wash_count} visits</div>
            <p className="text-purple-100">{5 - (user.wash_count % 5)} more visits until free wash!</p>
          </div>
          <div className="bg-white bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(user.wash_count % 5) * 20}%` }}
            ></div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <button 
            onClick={logout}
            className="w-full bg-red-50 hover:bg-red-100 rounded-xl p-4 flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-red-600">Sign Out</span>
            <span className="text-red-400">›</span>
          </button>
        </div>

        {/* Location Info */}
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

  // Other screens remain the same...
  const AppointmentsScreen = () => (
    <div className="pb-20">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">My Appointments</h2>
        {/* Appointments content... */}
      </div>
    </div>
  );

  const renderScreen = () => {
    switch(currentView) {
      case 'home': return <HomeScreen />;
      case 'book': return <BookScreen />;
      case 'appointments': return <AppointmentsScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Content */}
      <div className="pt-4">
        {renderScreen()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          {[
            { key: 'home', icon: Home, label: 'Home' },
            { key: 'book', icon: Plus, label: 'Book' },
            { key: 'appointments', icon: Clock, label: 'Visits' },
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
}

// Main App with Auth Provider
function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;