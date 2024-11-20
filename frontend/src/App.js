import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Home from './components/Home';
import Chat from './components/Chat/Chat';
import Profile from './components/Profile/Profile';
import Navbar from './components/Navbar';
import UserProfile from './components/UserProfile';
import Settings from './components/Settings';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={user.name ? <Navigate to="/conversations" /> : <Home />} />
        <Route path="/login" element={user.name ? <Navigate to="/conversations" /> : <Login />} />
        <Route path="/signup" element={user.name ? <Navigate to="/conversations" /> : <Signup />} />
        <Route path="/profile" element={user.name ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/conversations" element={user.name ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/chat/:conversationId" element={user.name ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/users/:username" element={user.name ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user.name ? <Settings /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
