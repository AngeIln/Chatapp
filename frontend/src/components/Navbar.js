// frontend/src/components/Navbar/Navbar.jsx
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  // Define routes where navbar should not be displayed
  const hideNavbarRoutes = ['/chat']; // Add other routes if necessary
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
              <ThemeToggle />
              {user.name ? (
                <div className={styles.authenticatedNav}>
                  <div className={styles.navLinks}>
                    <Link to="/conversations" className={styles.navLink}>
                      Conversations
                    </Link>
                    <Link to="/profile" className={styles.navLink}>
                      Profile
                    </Link>
                  </div>

                  <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className={styles.avatarImage} />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={styles.userName}>{user.name}</span>
                    </div>
                    <button onClick={logout} className={styles.logoutButton}>
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.authButtons}>
                  <Link to="/login" className={styles.loginButton}>
                    Login
                  </Link>
                  <Link to="/signup" className={styles.signupButton}>
                    Signup
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