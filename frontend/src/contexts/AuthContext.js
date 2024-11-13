// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  const login = async (username, password) => {
    const response = await axios.post('/login', {
      name: username,
      password: password,
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    // Fetch current user info
    const userResponse = await axios.get('/users/me');
    localStorage.setItem('user', JSON.stringify(userResponse.data));
    setUser(userResponse.data);
  };

  const signup = async (username, password) => {
    await axios.post('/signup', {
      name: username,
      password: password,
    });
    // After signup, log the user in
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};