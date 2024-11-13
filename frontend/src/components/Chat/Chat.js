// src/components/Chat/Chat.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Chat.module.css';

function Chat() {
  const { conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversation();
    const interval = setInterval(fetchConversation, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    try {
      const response = await axios.get(`/conversations/${conversationId}`);
      setConversation(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageText.trim() === '') return;

    try {
      const message = {
        sender: user.name,
        message: messageText,
        timestamp: new Date().toISOString(),
      };
      await axios.post(`/conversations/${conversationId}/messages`, message);
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
      setMessageText('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!conversation) {
    return (
      <div className={styles.notFound}>
        <h2>Conversation non trouvée</h2>
        <button onClick={() => navigate('/conversations')} className={styles.backButton}>
          Retour aux conversations
        </button>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(
    (name) => name !== user.name
  );

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/conversations')}
        >
          ←
        </button>
        <div className={styles.participantInfo}>
          <div className={styles.avatar}>{otherParticipant.charAt(0).toUpperCase()}</div>
          <span>{otherParticipant}</span>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {conversation.messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.messageWrapper} ${
              msg.sender === user.name ? styles.sent : styles.received
            }`}
          >
            <div className={styles.message}>
              <p>{msg.message}</p>
              <span className={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Écrivez votre message..."
          className={styles.messageInput}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={!messageText.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}

export default Chat;