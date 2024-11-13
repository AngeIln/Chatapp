import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import axios from '../../utils/api';
import { Link } from 'react-router-dom';
import styles from './Conversations.module.css';

function Conversations() {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user.name]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [convoResponse, usersResponse] = await Promise.all([
        axios.get('/conversations'),
        axios.get('/users')
      ]);
      
      setConversations(convoResponse.data);
      setUsers(usersResponse.data.filter(u => u.name !== user.name));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async (selectedUser) => {
    try {
      await axios.post('/conversations', [selectedUser]);
      await fetchData();
      setIsNewConvoOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const LoadingSpinner = () => (
    <div className={styles.loadingSpinner}>
      <div className={styles.spinner}></div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.conversationsWrapper}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Messages</h1>
            <button 
              className={styles.newChatBtn}
              onClick={() => setIsNewConvoOpen(true)}
              aria-label="Nouvelle conversation"
            >
              <span>+</span>
            </button>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={styles.conversationsList}>
            {conversations.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Aucune conversation pour le moment</p>
                <button 
                  onClick={() => setIsNewConvoOpen(true)}
                  className={styles.startChatBtn}
                >
                  Démarrer une conversation
                </button>
              </div>
            ) : (
              conversations.map((convo) => {
                const otherParticipant = convo.participants.find(
                  name => name !== user.name
                );
                return (
                  <Link 
                    to={`/chat/${convo.id}`} 
                    key={convo.id}
                    className={styles.conversationCard}
                  >
                    <div className={styles.avatarContainer}>
                      <div className={styles.avatar}>
                        {otherParticipant.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className={styles.conversationDetails}>
                      <h3>{otherParticipant}</h3>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      {isNewConvoOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewConvoOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nouvelle conversation</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setIsNewConvoOpen(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.usersList}>
              {filteredUsers.map((u) => (
                <div 
                  key={u.name} 
                  className={styles.userCard}
                  onClick={() => handleNewConversation(u.name)}
                >
                  <div className={styles.avatar}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{u.name}</span>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className={styles.noResults}>
                  Aucun utilisateur trouvé
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Conversations;