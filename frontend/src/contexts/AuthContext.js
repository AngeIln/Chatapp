// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: '',
    name: '',
    bio: '',
    avatar_url: ''
  });

  // Charger l'utilisateur depuis le localStorage au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        id: parsedUser.id || '',
        name: parsedUser.name || '',
        bio: parsedUser.bio || '',
        avatar_url: parsedUser.avatar_url || ''
      });
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

    // Récupérer les données de l'utilisateur actuel
    const userResponse = await axios.get('/users/me');
    const fetchedUser = userResponse.data;
    localStorage.setItem('user', JSON.stringify(fetchedUser));
    setUser({
      id: fetchedUser.id || '',
      name: fetchedUser.name || '',
      bio: fetchedUser.bio || '',
      avatar_url: fetchedUser.avatar_url || ''
    });
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
    setUser({
      id: '',
      name: '',
      bio: '',
      avatar_url: ''
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};