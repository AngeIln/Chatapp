import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, setUser } = useContext(AuthContext);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <nav className={styles.navbar}>
      <ul className={styles.navList}>
        {user.name ? (
          <>
            <li className={styles.navItem}>
              <Link to="/conversations" className={styles.navLink}>Conversations</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/profile" className={styles.navLink}>Profil</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/settings" className={styles.navLink}>Paramètres</Link>
            </li>
            <li className={styles.navItem}>
              <button onClick={handleLogout} className={styles.logoutButton}>Déconnexion</button>
            </li>
          </>
        ) : (
          <>
            <li className={styles.navItem}>
              <Link to="/login" className={styles.navLink}>Connexion</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/signup" className={styles.navLink}>Inscription</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
