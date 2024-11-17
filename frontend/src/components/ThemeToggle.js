// frontend/src/components/ThemeToggle.jsx
import React, { useEffect, useState } from 'react';
import { IoSunny, IoMoon } from 'react-icons/io5';
import styles from './ThemeToggle.module.css';

function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check for saved user preference
    const storedTheme = localStorage.getItem('app-theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  return (
    <button className={styles.toggleButton} onClick={toggleTheme} aria-label="Toggle Theme">
      {theme === 'light' ? <IoMoon /> : <IoSunny />}
    </button>
  );
}

export default ThemeToggle;