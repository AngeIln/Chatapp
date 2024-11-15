// src/components/Profile/Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

function Profile() {
  const { user } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // Charger la bio de l'utilisateur courant
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
    <div className={styles.profileContainer}>
      <h1>Mon Profil</h1>
      <div className={styles.profileInfo}>
        <div className={styles.avatar}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2>{user.name}</h2>
        {editing ? (
          <>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={styles.bioInput}
            />
            <button onClick={handleSave} className={styles.saveButton}>
              Sauvegarder
            </button>
          </>
        ) : (
          <>
            <p className={styles.bioText}>{bio || 'Aucune bio définie.'}</p>
            <button onClick={() => setEditing(true)} className={styles.editButton}>
              Éditer ma bio
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;