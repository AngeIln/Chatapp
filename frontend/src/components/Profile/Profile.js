// Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

function Profile() {
  const { user } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const response = await axios.get(`/users/${user.name}`);
        setBio(response.data.bio || '');
      } catch (error) {
        console.error('Erreur lors du chargement de la bio:', error);
      }
    };
    fetchBio();
  }, [user.name]);

  const handleSave = async () => {
    try {
      await axios.put('/users/me/bio', { bio });
      setEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la bio:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradient1}></div>
        <div className={styles.gradient2}></div>
        <div className={styles.gradient3}></div>
      </div>
      
      <div className={styles.glassOverlay}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatarRing}></div>
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <h1 className={styles.username}>{user.name}</h1>
          <div className={styles.statusBadge}>En ligne</div>
        </div>

        <div className={styles.bioSection}>
          {editing ? (
            <div className={styles.editContainer}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={styles.bioInput}
                placeholder="Écrivez quelque chose à propos de vous..."
              />
              <div className={styles.buttonGroup}>
                <button onClick={() => setEditing(false)} className={styles.cancelButton}>
                  Annuler
                </button>
                <button onClick={handleSave} className={styles.saveButton}>
                  Sauvegarder
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.bioContainer}>
              <p className={styles.bioText}>{bio || "Aucune bio définie."}</p>
              <button onClick={() => setEditing(true)} className={styles.editButton}>
                Éditer le profil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;