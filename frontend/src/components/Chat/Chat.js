// frontend/src/components/Chat/Chat.jsx

import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import {
  IoSend,
  IoMenu,
  IoSearch,
  IoEllipsisVertical,
  IoAdd,
  IoImage,
  IoDocument
} from 'react-icons/io5';
import styles from './Chat.module.css';

// Import Modal and other components
import CreateConversationModal from './CreateConversationModal';
import MessageReactions from './MessageReactions';

function Chat() {
  const { conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [fetchInterval, setFetchInterval] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [typingStatus, setTypingStatus] = useState('');

  // Animation variants
  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 }
  };

  // Fetch all users to map usernames to their avatars
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/users');
        const map = {};
        response.data.forEach(user => {
          map[user.name] = user.avatar_url;
        });
        setUsersMap(map);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchCurrentConversation();
      // Set up polling for new messages
      if (fetchInterval) clearInterval(fetchInterval);
      const interval = setInterval(fetchNewMessages, 3000);
      setFetchInterval(interval);
      return () => {
        clearInterval(interval);
        setFetchInterval(null);
      };
    } else {
      setCurrentConversation(null); // Reset if no conversation selected
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await axios.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchCurrentConversation = async () => {
    setLoadingMessages(true);
    try {
      const response = await axios.get(`/conversations/${conversationId}`);
      setCurrentConversation(response.data);
      const messages = response.data.messages;
      if (messages && messages.length > 0) {
        setLastMessageId(messages[messages.length - 1].id);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchNewMessages = async () => {
    try {
      const response = await axios.get(`/conversations/${conversationId}/messages`);
      const messages = response.data;
      if (messages && messages.length > 0) {
        // If lastMessageId is set, get new messages
        if (lastMessageId) {
          const lastMessageIndex = messages.findIndex(msg => msg.id === lastMessageId);
          if (lastMessageIndex !== -1 && lastMessageIndex < messages.length - 1) {
            const newMessages = messages.slice(lastMessageIndex + 1);
            setCurrentConversation(prev => ({
              ...prev,
              messages: [...prev.messages, ...newMessages]
            }));
            setLastMessageId(messages[messages.length - 1].id);
          }
        } else {
          // If no lastMessageId, set it
          setCurrentConversation(prev => ({
            ...prev,
            messages
          }));
          setLastMessageId(messages[messages.length - 1].id);
        }
      }
    } catch (error) {
      console.error('Error fetching new messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    let mediaUrl = null;
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post('/upload/avatar/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        mediaUrl = uploadResponse.data.avatar_url;
        setSelectedFile(null);
      } catch (error) {
        console.error('Error uploading media:', error);
        alert('Failed to upload media.');
        return;
      }
    }

    const payload = {
      content: message.trim(),
      media: mediaUrl
    };

    try {
      // Send message via POST request
      const response = await axios.post(`/conversations/${conversationId}/messages`, payload);
      const newMessage = response.data;

      // Update the conversation locally
      setCurrentConversation(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage]
      }));
      setLastMessageId(newMessage.id);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => {
    const conversationName = conv.name || conv.participants.join(', ');
    return conversationName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Typing Indicators (Optional)
  const handleTyping = () => {
    // Implement typing indicators if desired
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  // Modal handlers
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
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
            <div className={styles.userAvatar}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className={styles.avatarImage} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <h3>{user.name}</h3>
          </motion.div>
        </div>

        <div className={styles.searchContainer}>
          <IoSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.newConversationButton}>
          <button onClick={openCreateModal}>
            <IoAdd /> New Conversation
          </button>
        </div>

        {loadingConversations ? (
          <div className={styles.loader}>Loading conversations...</div>
        ) : (
          <div className={styles.conversationsList}>
            <AnimatePresence>
              {filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  className={`${styles.conversationItem} ${conv.id === conversationId ? styles.active : ''}`}
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
                    {conv.name
                      ? conv.name.charAt(0).toUpperCase()
                      : conv.participants[0].charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.conversationInfo}>
                    <h4>{conv.name || conv.participants.join(', ')}</h4>
                    <p>
                      {conv.messages && conv.messages.length > 0
                        ? `${conv.messages[conv.messages.length - 1].content.substring(0, 20)}...`
                        : 'No messages yet'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
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
                <h2>{currentConversation.name || currentConversation.participants.join(', ')}</h2>
                <span>{currentConversation.participants.length} participants</span>
              </div>
              <button className={styles.optionsButton}>
                <IoEllipsisVertical />
              </button>
            </header>

            <div className={styles.messagesContainer}>
              {loadingMessages ? (
                <div className={styles.loader}>Loading messages...</div>
              ) : (
                <>
                  <AnimatePresence>
                    {currentConversation.messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        className={`${styles.message} ${msg.sender === user.name ? styles.sent : styles.received}`}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <div className={styles.userAvatar}>
                          {msg.sender === user.name ? (
                            user.avatar_url ? (
                              <img src={user.avatar_url} alt="Your Avatar" className={styles.avatarImage} />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )
                          ) : (
                            usersMap[msg.sender] ? (
                              <img src={usersMap[msg.sender]} alt={`${msg.sender} Avatar`} className={styles.avatarImage} />
                            ) : (
                              msg.sender.charAt(0).toUpperCase()
                            )
                          )}
                        </div>
                        <div className={styles.messageContent}>
                          {msg.media && (
                            <div className={styles.mediaContent}>
                              {/\.(jpeg|jpg|gif|png)$/.test(msg.media) ? (
                                <img src={msg.media} alt="Media" className={styles.mediaImage} />
                              ) : (
                                <a href={msg.media} target="_blank" rel="noopener noreferrer" className={styles.mediaLink}>
                                  View Document <IoDocument />
                                </a>
                              )}
                            </div>
                          )}
                          <p>{msg.content}</p>
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={styles.reactions}>
                              {Object.entries(msg.reactions).map(([emoji, count]) => (
                                <span key={emoji}>{emoji} {count}</span>
                              ))}
                            </div>
                          )}
                          <span className={styles.timestamp}>
                            {formatTime(msg.timestamp)}
                          </span>
                          {/* Implement reactions if desired */}
                          {/* <MessageReactions onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)} /> */}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Typing Status (Optional) */}
            {typingStatus && <div className={styles.typingStatus}>{typingStatus}</div>}

            <form onSubmit={handleSendMessage} className={styles.messageForm}>
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Write your message..."
                className={styles.messageInput}
              />
              <input
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={handleFileChange}
                className={styles.fileInput}
                id="file-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className={styles.uploadButton}>
                <IoImage />
              </label>
              <button type="submit" disabled={!message.trim() && !selectedFile} className={styles.sendButton}>
                <IoSend />
              </button>
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
              <h2>Welcome to your Messenger</h2>
              <p>Select a conversation to start chatting</p>
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

      {/* Modal for Creating Conversation */}
      {isCreateModalOpen && (
        <CreateConversationModal
          onClose={closeCreateModal}
          onCreate={() => {
            fetchConversations();
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </motion.div>
  );
}

export default Chat;