import React from 'react';
import { IoHappy, IoThumbsUp, IoHeart } from 'react-icons/io5';
import styles from './MessageReactions.module.css';

const availableReactions = [
  { emoji: '😊', label: 'Happy', icon: <IoHappy /> },
  { emoji: '👍', label: 'Thumbs Up', icon: <IoThumbsUp /> },
  { emoji: '❤️', label: 'Heart', icon: <IoHeart /> },
];

function MessageReactions({ onAddReaction }) {
  return (
    <div className={styles.reactionsContainer}>
      {availableReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          className={styles.reactionButton}
          onClick={() => onAddReaction(reaction.emoji)}
          aria-label={reaction.label}
        >
          {reaction.icon}
        </button>
      ))}
    </div>
  );
}

export default MessageReactions;
