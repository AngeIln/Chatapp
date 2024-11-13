// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('https://python-hello-world-5.onrender.com/login', { name: username })
      .then(response => {
        setUser(username);
      })
      .catch(error => {
        if (error.response) {
          setError(error.response.data.detail);
        } else {
          setError('Erreur de connexion au serveur.');
        }
      });
  };

  return (
    <div>
      <h2>Se connecter</h2>
      <form onSubmit={handleSubmit}>
        <label>Nom d'utilisateur :</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Login;