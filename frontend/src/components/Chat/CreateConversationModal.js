// CreateConversationModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './CreateConversationModal.module.css';
import axios from '../../utils/api';

function CreateConversationModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/users');
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddParticipant = (user) => {
    if (!participants.find(p => p.id === user.id)) {
      setParticipants([...participants, user]);
    }
  };

  const handleRemoveParticipant = (user) => {
    setParticipants(participants.filter(p => p.id !== user.id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || participants.length === 0) return;

    const participantIds = participants.map(p => p.id);

    const conversationData = {
      name: name.trim(),
      participants: participantIds
    };

    onCreate(conversationData);
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
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
                <div key={user.id} className={styles.userItem}>
                  <span>{user.name}</span>
                  <button type="button" onClick={() => handleAddParticipant(user)}>
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.participants}>
            <h3>Participants :</h3>
            {participants.map(user => (
              <div key={user.id} className={styles.participantItem}>
                <span>{user.name}</span>
                <button type="button" onClick={() => handleRemoveParticipant(user)}>
                  Retirer
                </button>
              </div>
            ))}
          </div>

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