import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import axios from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setBio(user.bio || '');
  }, [user.bio]);

  const handleInputChange = (e) => {
    setBio(e.target.value);
  };

  const handleSaveBio = async () => {
    try {
      const response = await axios.put('/users/me/bio', { bio });
      setEditingBio(false);
      setUser(prevUser => ({
        ...prevUser,
        bio: response.data.bio,
      }));
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la bio.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    const file = selectedFile;
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { avatar_url } = response.data;
      setUser(prevUser => ({
        ...prevUser,
        avatar_url,
      }));

      localStorage.setItem('user', JSON.stringify({ ...user, avatar_url }));

      setSelectedFile(null);
      setPreviewImage(null);
      setError('');
    } catch (error) {
      setError('Erreur lors du téléchargement de l\'avatar.');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassOverlay}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className={styles.avatarImage} onError={(e) => e.target.src='default_avatar.png'}/>
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="avatar-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar-upload" className={styles.uploadLabel}>
              Changer l'avatar
            </label>
            {selectedFile && (
              <button onClick={handleAvatarUpload} className={styles.uploadButton}>
                Télécharger
              </button>
            )}
          </div>
          <h1 className={styles.username}>{user.name}</h1>
        </div>

        <div className={styles.bioSection}>
          {editingBio ? (
            <div className={styles.editContainer}>
              <textarea
                value={bio || ''}
                onChange={handleInputChange}
                className={styles.bioInput}
                placeholder="Écrivez quelque chose à propos de vous..."
              />
              <div className={styles.buttonGroup}>
                <button onClick={() => setEditingBio(false)} className={styles.cancelButton}>
                  Annuler
                </button>
                <button onClick={handleSaveBio} className={styles.saveButton}>
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.bioContainer}>
              <p className={styles.bioText}>{bio || "Aucune bio définie."}</p>
              <button onClick={() => setEditingBio(true)} className={styles.editButton}>
                Modifier le profil
              </button>
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          {selectedFile && (
            <div>
              <img src={previewImage} alt="Preview" className={styles.imagePreview} />
              <button onClick={removeSelectedFile} className={styles.closeButton}>
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
