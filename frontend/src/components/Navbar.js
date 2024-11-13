// Navbar.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <Link to="/" className={styles.navbarLogo}>
          ChatApp
        </Link>

        <div className={styles.navbarContent}>
          {user ? (
            <div className={styles.authenticatedNav}>
              <div className={styles.navLinks}>
                <Link to="/conversations" className={styles.navLink}>
                  Conversations
                </Link>
                <Link to="/profile" className={styles.navLink}>
                  Profil
                </Link>
              </div>
              
              <div className={styles.userSection}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span className={styles.userName}>
                    {user.name || user.email}
                  </span>
                </div>
                <button 
                  onClick={logout} 
                  className={styles.logoutButton}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.loginButton}>
                Se connecter
              </Link>
              <Link to="/signup" className={styles.signupButton}>
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;