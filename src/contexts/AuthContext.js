import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { storage } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const storedUser = await authAPI.getCurrentUser();
      const token = await storage.getToken();

      if (storedUser && token) {
        setUser(storedUser);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(username, email, password);

      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(emailOrUsername, password);

      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (accessToken) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.loginWithGoogle(accessToken);

      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Google login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithDiscord = async (accessToken) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.loginWithDiscord(accessToken);

      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Discord login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (accessToken) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.loginWithFacebook(accessToken);

      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Facebook login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.logout();
      setUser(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Logout failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    storage.saveUser(updatedUser);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    loginWithGoogle,
    loginWithDiscord,
    loginWithFacebook,
    logout,
    updateUser,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
