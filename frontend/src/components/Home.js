// Home.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = () => navigate('/login');
  const handleSignUp = () => navigate('/signup');
  const handleStartChat = () => navigate('/conversations');

  return (
    <div className={styles.container}>
      

      <main className={styles.content}>
        {user ? (
          <div className={styles.authenticatedContent}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <h2 className={styles.welcomeText}>
              Ravi de vous revoir, <span className={styles.userName}>{user.name}</span>
            </h2>

            <button 
              className={styles.mainButton}
              onClick={handleStartChat}
            >
              Accéder aux conversations
            </button>
          </div>
        ) : (
          <div className={styles.unauthenticatedContent}>
            <h2 className={styles.heroTitle}>
              Connectez-vous pour commencer
            </h2>
            <p className={styles.heroText}>
              Rejoignez une communauté dynamique et échangez en temps réel
            </p>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.mainButton} ${styles.loginButton}`}
                onClick={handleLogin}
              >
                Se connecter
              </button>

              <button
                className={`${styles.mainButton} ${styles.signupButton}`}
                onClick={handleSignUp}
              >
                Créer un compte
              </button>
            </div>

            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🔒</span>
                <p>Messagerie sécurisée</p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>⚡</span>
                <p>Temps réel</p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🌐</span>
                <p>Accessible partout</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;