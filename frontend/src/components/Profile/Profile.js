// frontend/src/components/Profile/Profile.jsx

import React, { useContext, useEffect, useState } from 'react';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBio(user.bio || '');
  }, [user.bio]);

  const handleSaveBio = async () => {
    try {
      const response = await axios.put('/users/me/bio', { bio });
      setEditingBio(false);
      // Update user context and localStorage
      const updatedUser = { ...user, bio: response.data.bio };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error saving bio:', error);
      setError('Failed to save bio.');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Basic client-side validation
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Unsupported file type. Please upload a JPEG, PNG, or GIF image.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/upload/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { avatar_url } = response.data;

      // Update user context and localStorage
      const updatedUser = { ...user, avatar_url };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setError('');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar.');
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
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className={styles.avatarImage} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              id="avatar-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar-upload" className={styles.uploadLabel}>
              Change Avatar
            </label>
          </div>
          <h1 className={styles.username}>{user.name}</h1>
          <div className={styles.statusBadge}>Online</div>
        </div>

        <div className={styles.bioSection}>
          {editingBio ? (
            <div className={styles.editContainer}>
              <textarea
                value={bio || ''}
                onChange={(e) => setBio(e.target.value)}
                className={styles.bioInput}
                placeholder="Write something about yourself..."
              />
              <div className={styles.buttonGroup}>
                <button onClick={() => setEditingBio(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleSaveBio} className={styles.saveButton}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.bioContainer}>
              <p className={styles.bioText}>{bio || "No bio set."}</p>
              <button onClick={() => setEditingBio(true)} className={styles.editButton}>
                Edit Profile
              </button>
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default Profile;