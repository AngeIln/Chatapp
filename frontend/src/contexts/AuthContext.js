// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Charger l'utilisateur depuis le localStorage au démarrage
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

    // Récupérer les informations de l'utilisateur courant
    const userResponse = await axios.get('/users/me');
    localStorage.setItem('user', JSON.stringify(userResponse.data));
    setUser(userResponse.data);
  };

  const signup = async (username, password) => {
    await axios.post('/signup', {
      name: username,
      password: password,
    });
    // Après l'inscription, connecter l'utilisateur
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