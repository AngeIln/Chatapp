// frontend/src/components/Chat/CreateConversationModal.jsx

import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import styles from './CreateConversationModal.module.css';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';

function CreateConversationModal({ onClose, onCreate }) {
  const { user } = useContext(AuthContext);
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
      // Exclude current user from participants
      const otherUsers = response.data.filter(u => u.name !== user.name);
      setAllUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users.');
    }
  };

  const handleToggleParticipant = (userName) => {
    if (participants.includes(userName)) {
      setParticipants(participants.filter(p => p !== userName));
    } else {
      setParticipants([...participants, userName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (participants.length === 0) {
      setError('Please add at least one participant.');
      return;
    }
    try {
      const conversationData = {
        name: name.trim() || null,
        participants
      };
      await axios.post('/conversations', conversationData);
      onCreate();
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation.');
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase())
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
        <h2>Create a New Conversation</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Conversation Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter conversation name"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Add Participants</label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            <div className={styles.usersList}>
              {filteredUsers.map(user => (
                <div key={user.id} className={styles.userItem}>
                  <label>
                    <input
                      type="checkbox"
                      checked={participants.includes(user.name)}
                      onChange={() => handleToggleParticipant(user.name)}
                    />
                    {user.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.participants}>
            <h3>Selected Participants:</h3>
            {participants.map(name => (
              <div key={name} className={styles.participantItem}>
                <span>{name}</span>
                <button type="button" onClick={() => handleToggleParticipant(name)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateConversationModal;