// src/components/Chat/CreateConversationModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './CreateConversationModal.module.css';
import axios from '../../utils/api';

function CreateConversationModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/users');
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erreur lors du chargement des utilisateurs.');
    }
  };

  const handleAddParticipant = (userName) => {
    if (!participants.includes(userName)) {
      setParticipants([...participants, userName]);
    }
  };

  const handleRemoveParticipant = (userName) => {
    setParticipants(participants.filter(p => p !== userName));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || participants.length === 0) {
      setError('Veuillez entrer un nom de conversation et ajouter des participants.');
      return;
    }

    const conversationData = {
      name: name.trim(),
      participants: participants // Already names
    };

    onCreate(conversationData);
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchUser.toLowerCase()) &&
    user.name !== '' // Remplacez par `user.name !== currentUserName` si nécessaire
  );

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Créer une nouvelle conversation</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Nom de la conversation</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Ajouter des participants</label>
            <input
              type="text"
              placeholder="Rechercher des utilisateurs..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            <div className={styles.usersList}>
              {filteredUsers.map(user => (
                <div key={user.name} className={styles.userItem}>
                  <span>{user.name}</span>
                  <button type="button" onClick={() => handleAddParticipant(user.name)}>
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.participants}>
            <h3>Participants :</h3>
            {participants.map(name => (
              <div key={name} className={styles.participantItem}>
                <span>{name}</span>
                <button type="button" onClick={() => handleRemoveParticipant(name)}>
                  Retirer
                </button>
              </div>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Annuler
            </button>
            <button type="submit" className={styles.createButton}>
              Créer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateConversationModal;