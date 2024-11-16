import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: '',
    name: '',
    bio: ''
  });

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        id: parsedUser.id || '',
        name: parsedUser.name || '',
        bio: parsedUser.bio || ''
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

    // Récupérer les informations de l'utilisateur courant
    const userResponse = await axios.get('/users/me');
    const fetchedUser = userResponse.data;
    localStorage.setItem('user', JSON.stringify(fetchedUser));
    setUser({
      id: fetchedUser.id || '',
      name: fetchedUser.name || '',
      bio: fetchedUser.bio || ''
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
      bio: ''
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};