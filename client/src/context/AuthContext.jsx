import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authApi.getMe();
        const profile = response.data?.profile || {};
        const userData = {
          id: response.data?.id || profile.id,
          email: response.data?.email,
          full_name: response.data?.full_name || profile.full_name,
          role: response.data?.role || profile.role,
          phone: profile.phone,
          profile: response.data?.profile,
          patient: response.data?.patient,
          doctor: response.data?.doctor
        };
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      console.log('[LOGIN] Response:', response.data);
      localStorage.setItem('access_token', response.data.session.access_token);
      localStorage.setItem('refresh_token', response.data.session.refresh_token);
      setUser(response.data.user);
      console.log('[LOGIN] User set:', response.data.user);
      toast.success('Login successful');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('[LOGIN] Error:', error);
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      toast.success('Registration successful! Please login.');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const role = user?.role || user?.profile?.role;
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isDoctor: role === 'doctor',
    isPatient: role === 'patient',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
