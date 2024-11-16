import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import backgroundVideo from './Space.mp4';

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionsRef = useRef([]);

  const handleLogin = () => navigate('/login');
  const handleSignUp = () => navigate('/signup');
  const handleStartChat = () => navigate('/conversations');

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1)
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalHeight;
      setScrollProgress(progress);

      // Check each section for visibility
      sectionsRef.current.forEach(section => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.75;
        if (isVisible) {
          section.classList.add(styles.revealed);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Progress line width calculation
  const progressWidth = `${scrollProgress * 100}%`;

  return (
    <div className={styles.mainContainer}>
      {/* Progress Line */}
      <div className={styles.progressLine}>
        <div className={styles.progressFill} style={{ width: progressWidth }} />
      </div>

      {/* Background Video */}
      <div className={styles.videoOverlay} style={{ 
        opacity: Math.min(0.4 + scrollProgress * 0.4, 0.8) 
      }} />
      <video
        autoPlay
        muted
        loop
        playsInline
        className={styles.backgroundVideo}
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      {/* Hero Section */}
      <section 
        className={`${styles.section} ${styles.heroSection}`}
        ref={el => sectionsRef.current[0] = el}
      >
        <div className={styles.contentWrapper}>
          {user.name ? (
            <div className={styles.authenticatedContent}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h1 className={styles.welcomeText}>
                Ravi de vous revoir, <span className={styles.userName}>{user.name}</span>
              </h1>
              <button className={styles.mainButton} onClick={handleStartChat}>
                Accéder aux conversations
              </button>
            </div>
          ) : (
            <div className={styles.unauthenticatedContent}>
              <h1 className={styles.heroTitle}>Connectez-vous pour commencer</h1>
              <p className={styles.heroText}>
                Rejoignez une communauté dynamique et échangez en temps réel
              </p>
              <div className={styles.actionButtons}>
                <button className={styles.mainButton} onClick={handleLogin}>
                  Se connecter
                </button>
                <button className={styles.mainButton} onClick={handleSignUp}>
                  Créer un compte
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section 
        className={`${styles.section} ${styles.featuresSection}`}
        ref={el => sectionsRef.current[1] = el}
      >
        <div className={styles.contentWrapper}>
          <h2 className={styles.sectionTitle}>Nos Fonctionnalités</h2>
          <div className={styles.featuresGrid}>
            {[
              { icon: '🔒', title: 'Sécurisé', desc: 'Protection de bout en bout' },
              { icon: '⚡', title: 'Rapide', desc: 'Communication en temps réel' },
              { icon: '🌐', title: 'Global', desc: 'Accessible partout' },
              { icon: '📱', title: 'Mobile', desc: 'Application responsive' },
            ].map((feature, index) => (
              <div 
                key={index}
                className={styles.featureCard}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        className={`${styles.section} ${styles.statsSection}`}
        ref={el => sectionsRef.current[2] = el}
      >
        <div className={styles.contentWrapper}>
          <h2 className={styles.sectionTitle}>Nos Chiffres</h2>
          <div className={styles.statsGrid}>
            {[
              { number: <span style={{ fontFamily: 'serif' }}>&#x221A;100%</span>, label: 'de satisfaction client' },
              { number: <span style={{ fontFamily: 'serif' }}>10MD<sup>0</sup></span>, label: 'Messages' },
              { number: '99.9%', label: 'indisponibilité' },
            ].map((stat, index) => (
              <div 
                key={index}
                className={styles.statCard}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <span className={styles.statNumber}>{stat.number}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        className={`${styles.section} ${styles.contactSection}`}
        ref={el => sectionsRef.current[3] = el}
      >
        <div className={styles.contentWrapper}>
          <h2 className={styles.sectionTitle}>Contactez-nous</h2>
          <div className={styles.contactContent}>
            <p className={styles.contactText}>
              Prêt a nous rejoindre !
            </p>
            <button className={styles.mainButton}>
              Commencer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;