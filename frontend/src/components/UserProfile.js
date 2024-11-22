import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/api';
import styles from './UserProfile.module.css';
import { AuthContext } from '../contexts/AuthContext';

function UserProfile() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/users/${username}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur', error);
      }
    };

    fetchUserData();
  }, [username]);

  if (!userData) {
    return <div>Chargement du profil...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.avatar}>
        {userData.avatar_url ? (
          <img src={userData.avatar_url} alt={`${userData.name} Avatar`} onError={(e) => e.target.src='default_avatar.png'}/>
        ) : (
          <span>{userData.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <h2>{userData.name}</h2>
      <p>{userData.bio}</p>
      {currentUser.name === userData.name && (
        <p>Ceci est votre profil</p>
      )}
    </div>
  );
}

export default UserProfile;
