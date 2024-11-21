// frontend/src/components/Chat/MessageReactions.jsx

import React from 'react';
import { IoHappy, IoThumbsUp, IoHeart } from 'react-icons/io5';
import styles from './MessageReactions.module.css';
import axios from '../../utils/api';

const availableReactions = [
  { emoji: '😊', label: 'Happy', icon: <IoHappy /> },
  { emoji: '👍', label: 'Thumbs Up', icon: <IoThumbsUp /> },
  { emoji: '❤️', label: 'Heart', icon: <IoHeart /> },
];

function MessageReactions({ messageId, conversationId, onAddReaction }) {
  const handleAddReaction = async (reaction) => {
    try {
      await axios.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { reaction });
      onAddReaction(reaction);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction :', error);
    }
  };

  return (
    <div className={styles.reactionsContainer}>
      {availableReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          className={styles.reactionButton}
          onClick={() => handleAddReaction(reaction.emoji)}
          aria-label={reaction.label}
        >
          {reaction.icon}
        </button>
      ))}
    </div>
  );
}

export default MessageReactions;
