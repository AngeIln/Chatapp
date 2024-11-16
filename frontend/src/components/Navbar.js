// src/components/Navbar/Navbar.jsx
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  // Définir les routes où la navbar ne doit pas être affichée
  const hideNavbarRoutes = ['/chat']; // Ajoutez d'autres routes si nécessaire
  const shouldHideNavbar = hideNavbarRoutes.some(route => location.pathname.startsWith(route));

  return (
    <AnimatePresence>
      {!shouldHideNavbar && (
        <motion.nav
          className={styles.navbar}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.navbarContainer}>
            <Link to="/" className={styles.navbarLogo}>
              ChatApp
            </Link>

            <div className={styles.navbarContent}>
              {user.name ? (
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
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.userName}>{user.name}</span>
                    </div>
                    <button onClick={logout} className={styles.logoutButton}>
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
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default Navbar;