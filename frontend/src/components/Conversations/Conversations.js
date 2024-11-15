// src/components/Conversations/Conversations.jsx
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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user.name]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [convoResponse, usersResponse] = await Promise.all([
        axios.get('/conversations'),
        axios.get('/users'),
      ]);

      setConversations(convoResponse.data);
      setUsers(usersResponse.data.filter((u) => u.name !== user.name));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (username) => {
    if (selectedUsers.includes(username)) {
      setSelectedUsers(selectedUsers.filter((user) => user !== username));
      setSelectedUserProfile(null);
    } else {
      setSelectedUsers([...selectedUsers, username]);
      try {
        const response = await axios.get(`/users/${username}`);
        setSelectedUserProfile(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur:', error);
      }
    }
  };

  const handleCreateConversation = async () => {
    try {
      await axios.post('/conversations', {
        participants: selectedUsers,
        name: groupName || null,
      });
      await fetchData();
      setIsNewConvoOpen(false);
      setSelectedUsers([]);
      setGroupName('');
      setSelectedUserProfile(null);
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.conversationsWrapper}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Conversations</h1>
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
          <div className={styles.loading}>Chargement...</div>
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
                let displayName = '';
                if (convo.name) {
                  displayName = convo.name;
                } else {
                  const otherParticipants = convo.participants.filter(
                    (name) => name !== user.name
                  );
                  displayName = otherParticipants.join(', ');
                }
                return (
                  <Link
                    to={`/chat/${convo.id}`}
                    key={convo.id}
                    className={styles.conversationCard}
                  >
                    <div className={styles.avatarContainer}>
                      <div className={styles.avatar}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className={styles.conversationDetails}>
                      <h3>{displayName}</h3>
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nouvelle conversation</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setIsNewConvoOpen(false);
                  setSelectedUsers([]);
                  setGroupName('');
                  setSelectedUserProfile(null);
                }}
              >
                ×
              </button>
            </div>

            {selectedUsers.length > 1 && (
              <div className={styles.groupNameContainer}>
                <input
                  type="text"
                  placeholder="Nom du groupe (optionnel)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={styles.groupNameInput}
                />
              </div>
            )}

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
                  className={`${styles.userCard} ${
                    selectedUsers.includes(u.name) ? styles.selected : ''
                  }`}
                  onClick={() => handleUserSelect(u.name)}
                >
                  <div className={styles.avatar}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{u.name}</span>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className={styles.noResults}>Aucun utilisateur trouvé</div>
              )}
            </div>

            {selectedUserProfile && selectedUsers.length === 1 && (
              <div className={styles.userProfile}>
                <h3>{selectedUserProfile.name}</h3>
                <p>{selectedUserProfile.bio || 'Cet utilisateur n\'a pas de bio.'}</p>
              </div>
            )}

            <button
              onClick={handleCreateConversation}
              className={styles.createGroupButton}
              disabled={selectedUsers.length === 0}
            >
              Créer la conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Conversations;