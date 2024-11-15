// Chat.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import { IoSend, IoMenu, IoSearch, IoEllipsisVertical, IoAdd } from 'react-icons/io5';
import styles from './Chat.module.css';

// Importer le composant Modal
import CreateConversationModal from './CreateConversationModal';

function Chat() {
  const { conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // État pour le modal
  const messagesEndRef = useRef(null);

  // Animation variants
  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", damping: 25 } }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchCurrentConversation();
      const interval = setInterval(fetchCurrentConversation, 3000);
      return () => clearInterval(interval);
    } else {
      setCurrentConversation(null); // Réinitialiser si pas de conversation sélectionnée
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchCurrentConversation = async () => {
    try {
      const response = await axios.get(`/conversations/${conversationId}`);
      setCurrentConversation({
        ...response.data,
        messages: response.data.messages || []
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const newMessage = {
        content: message,
        sender: user.id,
        timestamp: new Date().toISOString()
      };

      await axios.post(`/conversations/${conversationId}/messages`, newMessage);
      setMessage('');
      fetchCurrentConversation();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => {
    const conversationName = conv.name || '';
    return conversationName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour ouvrir le modal de création
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // Fonction pour fermer le modal de création
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Fonction pour créer une nouvelle conversation
  const handleCreateConversation = async (conversationData) => {
    try {
      const response = await axios.post('/conversations', conversationData);
      // Actualiser la liste des conversations
      fetchConversations();
      closeCreateModal();
      // Naviguer vers la nouvelle conversation
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <motion.aside
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.sidebarHeader}>
          <motion.div
            className={styles.userProfile}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
          >
            <div className={styles.userAvatar}>{user.name[0]}</div>
            <h3>{user.name}</h3>
          </motion.div>
        </div>

        <div className={styles.searchContainer}>
          <IoSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.newConversationButton}>
          <button onClick={openCreateModal}>
            <IoAdd /> Nouvelle Conversation
          </button>
        </div>

        <div className={styles.conversationsList}>
          <AnimatePresence>
            {filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                className={`${styles.conversationItem} ${
                  conv.id === conversationId ? styles.active : ''
                }`}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ x: 5 }}
                onClick={() => {
                  navigate(`/chat/${conv.id}`);
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className={styles.conversationAvatar}>
                  {(conv.name || '?')[0]}
                </div>
                <div className={styles.conversationInfo}>
                  <h4>{conv.name || 'Conversation sans nom'}</h4>
                  <p>{conv.lastMessage?.content || 'Nouvelle conversation'}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className={styles.unreadBadge}>
                    {conv.unreadCount}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className={styles.chatArea}>
        {currentConversation ? (
          <>
            <header className={styles.chatHeader}>
              <button
                className={styles.menuButton}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <IoMenu />
              </button>
              <div className={styles.chatInfo}>
                <h2>{currentConversation.name}</h2>
                <span>{currentConversation.participants.length} participants</span>
              </div>
              <button className={styles.optionsButton}>
                <IoEllipsisVertical />
              </button>
            </header>

            <div className={styles.messagesContainer}>
              <AnimatePresence>
                {(currentConversation.messages || []).map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`${styles.message} ${
                      msg.sender === user.id ? styles.sent : styles.received
                    }`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <p>{msg.content}</p>
                    <span className={styles.timestamp}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={styles.messageForm}>
              <motion.input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                whileFocus={{ scale: 1.01 }}
              />
              <motion.button
                type="submit"
                disabled={!message.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IoSend />
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div
            className={styles.welcomeScreen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.welcomeContent}>
              <h2>Bienvenue sur votre messagerie</h2>
              <p>Sélectionnez une conversation pour commencer à discuter</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Modal pour la création de conversation */}
      {isCreateModalOpen && (
        <CreateConversationModal
          onClose={closeCreateModal}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
}

export default Chat;