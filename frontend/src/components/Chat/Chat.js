import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import { IoSend, IoSearch, IoAdd, IoImageOutline, IoCloseOutline } from 'react-icons/io5';
import styles from './Chat.module.css';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);
  const [usersMap, setUsersMap] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/users');
        const map = {};
        response.data.forEach(user => {
          map[user.name] = {
            avatar_url: user.avatar_url,
            name: user.name,
          };
        });
        setUsersMap(map);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
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
      const interval = setInterval(fetchCurrentConversation, 3000);
      return () => clearInterval(interval);
    } else {
      setCurrentConversation(null);
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
      console.error('Erreur lors de la récupération des conversations :', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchCurrentConversation = async () => {
    if (!conversationId) return;

    setLoadingMessages(true);
    try {
      const response = await axios.get(`/conversations/${conversationId}`);
      setCurrentConversation(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation :', error);
    } finally {
      setLoadingMessages(false);
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

        const uploadResponse = await axios.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        mediaUrl = uploadResponse.data.url;
        setSelectedFile(null);
        setPreviewImage(null);
      } catch (error) {
        console.error('Erreur lors du téléchargement du média :', error);
        alert('Échec du téléchargement du média.');
        return;
      }
    }

    const payload = {
      content: message.trim(),
      media: mediaUrl,
    };

    try {
      const response = await axios.post(`/conversations/${conversationId}/messages`, payload);
      const newMessage = response.data;

      setCurrentConversation(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));
      setMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message :', error);
    }
  };

  const handleAddReaction = async (messageId, reaction) => {
    try {
      await axios.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { reaction });
      setCurrentConversation(prev => {
        const updatedMessages = prev.messages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reaction]: (msg.reactions[reaction] || 0) + 1,
              },
            };
          }
          return msg;
        });
        return { ...prev, messages: updatedMessages };
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction :', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => {
    const conversationName = conv.name || conv.participants.join(', ');
    return conversationName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div
            className={styles.userProfile}
            onClick={() => navigate('/profile')}
          >
            <div className={styles.userAvatar}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className={styles.avatarImage} />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className={styles.userName}>{user.name}</span>
          </div>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Rechercher des conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <IoSearch className={styles.searchIcon} />
        </div>

        <button onClick={openCreateModal} className={styles.newConversationButton}>
          <IoAdd /> Nouvelle Conversation
        </button>

        {loadingConversations ? (
          <div className={styles.loader}>Chargement des conversations...</div>
        ) : (
          <div className={styles.conversationsList}>
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${conv.id === conversationId ? styles.active : ''}`}
                onClick={() => navigate(`/chat/${conv.id}`)}
              >
                <div className={styles.conversationAvatar}>
                  {usersMap[conv.participants[0]]?.avatar_url ? (
                    <img src={usersMap[conv.participants[0]].avatar_url} alt={`${usersMap[conv.participants[0]].name} Avatar`} />
                  ) : (
                    <span>{usersMap[conv.participants[0]]?.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.conversationInfo}>
                  <span className={styles.conversationName}>
                    {usersMap[conv.participants[0]]?.name || conv.participants.join(', ')}
                  </span>
                  <span className={styles.conversationMessage}>
                    {conv.lastMessage?.content ? `${conv.lastMessage.content.substring(0, 30)}${conv.lastMessage.content.length > 30 ? '...' : ''}` : 'Aucun message'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className={styles.chatArea}>
        {currentConversation ? (
          loadingMessages ? (
            <div className={styles.loader}>Chargement des messages...</div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatTitle}>
                    {currentConversation.name || currentConversation.participants.join(', ')}
                  </span>
                  <span className={styles.participantsCount}>
                    {currentConversation.participants.length} participants
                  </span>
                </div>
              </div>
              <div className={styles.messagesContainer}>
                {currentConversation.messages && currentConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.messageGroup} ${msg.sender === user.name ? styles.sent : styles.received}`}
                  >
                    <div className={styles.messagePicture}>
                      {msg.sender === user.name ? (
                        user.avatar_url ? (
                          <img src={user.avatar_url} alt="Your Avatar" className={styles.avatarImage} />
                        ) : (
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        )
                      ) : (
                        usersMap[msg.sender]?.avatar_url ? (
                          <img src={usersMap[msg.sender].avatar_url} alt={`${msg.sender} Avatar`} className={styles.avatarImage} />
                        ) : (
                          <span>{usersMap[msg.sender]?.name.charAt(0).toUpperCase()}</span>
                        )
                      )}
                    </div>
                    <div className={styles.messageContentWrapper}>
                      <span className={styles.messageSender}>
                        {msg.sender === user.name ? 'Vous' : usersMap[msg.sender]?.name || msg.sender}
                      </span>
                      <div className={styles.messageContent}>
                        {msg.content && <p>{msg.content}</p>}
                        {msg.media && (
                          <img src={msg.media} alt="Shared media" className={styles.messageMedia} />
                        )}
                        <div className={styles.messageTime}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                        <div className={styles.reactions}>
                          {msg.reactions && Object.entries(msg.reactions).map(([emoji, count]) => (
                            <span key={emoji} className={styles.reaction}>
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                        <MessageReactions onAddReaction={(reaction) => handleAddReaction(msg.id, reaction)} />
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className={styles.messageForm}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className={styles.messageInput}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className={styles.uploadButton}>
                  <IoImageOutline />
                </label>
                {selectedFile && (
                  <div className={styles.previewContainer}>
                    <img src={previewImage} alt="Preview" className={styles.previewImage} />
                    <button type="button" onClick={removeSelectedFile} className={styles.removePreviewButton}>
                      <IoCloseOutline />
                    </button>
                  </div>
                )}
                <button type="submit" className={styles.sendButton}>
                  <IoSend />
                </button>
              </form>
            </>
          )
        ) : (
          <div className={styles.welcomeMessage}>
            <h2>Bienvenue dans votre messagerie</h2>
            <p>Sélectionnez une conversation ou créez-en une nouvelle pour commencer à discuter.</p>
          </div>
        )}
      </main>

      {isCreateModalOpen && (
        <CreateConversationModal onClose={closeCreateModal} onConversationCreated={fetchConversations} />
      )}
    </div>
  );
}

export default Chat;
