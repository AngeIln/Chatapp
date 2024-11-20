import React, { useState } from 'react';
import styles from './Settings.module.css';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  const handleDarkModeToggle = () => {
    setDarkMode(prevDarkMode => !prevDarkMode); // Correction ici
    document.documentElement.setAttribute('data-theme', prevDarkMode ? 'light' : 'dark');
  };

  const handleFontSizeChange = (event) => {
    setFontSize(event.target.value);
  };

  return (
    <div className={styles.container}>
      <h1>Paramètres</h1>
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
      </div>
    </div>
  );
};

export default Settings;
