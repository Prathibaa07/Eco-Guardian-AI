import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const MOCK_USER_STORAGE_KEY = 'ecoguardian_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Sync with backend database to get latest points/badges
          try {
            const res = await axios.get(`/api/users/${parsedUser.id}`);
            setUser(res.data);
            localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(res.data));
          } catch (err) {
            console.warn("Could not sync profile with backend, using cached profile:", err);
            setUser(parsedUser);
          }
        } else {
          // No stored session — user is not logged in
          setUser(null);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email });
      const userData = response.data.user;
      
      // Fetch full profile (includes badges)
      const profileResponse = await axios.get(`/api/users/${userData.id}`);
      const fullUser = profileResponse.data;
      
      setUser(fullUser);
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(fullUser));
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Login failed. Please verify your connection." 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, fullName) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password: "password123", // default password for local demo flow
        full_name: fullName
      });
      const userData = response.data.user;
      
      setUser(userData);
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Registration failed." 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`/api/users/${user.id}`);
      setUser(res.data);
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(res.data));
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
