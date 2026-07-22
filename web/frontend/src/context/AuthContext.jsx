import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Load profile info if already set
      if (parsedUser.profileCompleted) {
        API.get('/profile')
          .then(res => {
            if (res.data.success) {
              setProfile(res.data.profile);
            }
          })
          .catch(err => {
            console.error('Initial profile fetch failed', err.message);
          });
      }
    }
    setLoading(false);
  }, []);

  // Login
  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: jwtToken, user: userData } = res.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        
        if (userData.profileCompleted) {
          const profRes = await API.get('/profile');
          if (profRes.data.success) {
            setProfile(profRes.data.profile);
          }
        } else {
          setProfile(null);
        }
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Signup
  const signupUser = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/signup', { name, email, password, phone });
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Signup failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtpCode = async (email, otp) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        const { token: jwtToken, user: userData } = res.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        setProfile(null);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  // Reload/Update profile details
  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await API.get('/profile');
      if (res.data.success) {
        setProfile(res.data.profile);
        
        // Also update local storage if completed
        const updatedUser = { ...user, profileCompleted: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error.message);
    }
  };

  // Save/Update profile details
  const updateProfileDetails = async (profileData) => {
    try {
      const res = await API.post('/profile', profileData);
      if (res.data.success) {
        setProfile(res.data.profile);
        const updatedUser = { ...user, profileCompleted: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Profile update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        loading,
        login: loginUser,
        signup: signupUser,
        verifyOtp: verifyOtpCode,
        logout: logoutUser,
        refreshProfile,
        updateProfile: updateProfileDetails
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
