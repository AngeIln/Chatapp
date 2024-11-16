// src/components/Auth/Signup.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Signup.module.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useContext(AuthContext);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(username, password);
      navigate('/');
    } catch (err) {
      setError("Erreur lors de l'inscription");
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.overlay}></div>
      <div className={styles.formContainer}>
        <h1 className={styles.logo}>ChatApp</h1>
        <h2 className={styles.title}>Créer un compte</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputField}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nom d'utilisateur"
            />
          </div>

          <div className={styles.inputField}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mot de passe"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button}>
            S'inscrire
          </button>
        </form>

        <Link to="/login" className={styles.link}>
          Déjà un compte ? Se connecter
        </Link>
      </div>
    </motion.div>
  );
}

export default Signup;