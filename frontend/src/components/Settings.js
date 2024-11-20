import React, { useState, useEffect, useCallback } from 'react';
import styles from './Settings.module.css';
import { FontAwesome } from '@fortawesome/react-fontawesome';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [theme]);

  const handleDarkModeToggle = useCallback(() => {
    const prevDarkMode = darkMode;
    setDarkMode(!prevDarkMode);
    document.documentElement.setAttribute('data-theme', prevDarkMode ? 'light' : 'dark');
  });

  const handleFontSizeChange = (event) => {
    setFontSize(event.target.value);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Paramètres</h1>
      <div className={styles.settingsContainer}>
        <div className={styles.settingItem}>
          <label htmlFor="darkModeToggle">Mode sombre</label>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={handleDarkModeToggle}
            className={styles.toggle}
          />
        </div>
        <div className={styles.settingItem}>
          <label htmlFor="fontSizeSlider">Taille de la police</label>
          <input
            type="range"
            min="10"
            max="30"
            value={fontSize}
            onChange={handleFontSizeChange}
            className={styles.slider}
          />
        </div>
        <div className={styles.settingItem}>
          <label htmlFor="themeSelector">Thème</label>
          <select value={theme} onChange={handleThemeChange} className={styles.select}>
            <option value="light" className={styles.option}>Mode clair</option>
            <option value="dark" className={styles.option}>Mode sombre</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
