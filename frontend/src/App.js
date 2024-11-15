// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Home from './components/Home';
import Chat from './components/Chat/Chat';
import Profile from './components/Profile/Profile';
import Navbar from './components/Navbar';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/conversations" /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/conversations" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/conversations" /> : <Signup />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/conversations" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/chat/:conversationId" element={user ? <Chat /> : <Navigate to="/login" />} />
        {/* Redirection pour les chemins non définis */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;