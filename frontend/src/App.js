// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Home from './components/Home';
import Chat from './components/Chat/Chat';
import Conversations from './components/Conversations/Conversations';
import Profile from './components/Profile/Profile'; // Import du composant Profil
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} /> {/* Route pour le profil */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;