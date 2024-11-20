// frontend/src/components/Home.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
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
                Welcome back, <span className={styles.userName}>{user.name}</span>
              </h1>
              <button className={styles.mainButton} onClick={handleStartChat}>
                Go to Conversations
              </button>
            </div>
          ) : (
            <div className={styles.unauthenticatedContent}>
              <h1 className={styles.heroTitle}>Connect to Start Chatting</h1>
              <p className={styles.heroText}>
                Join a dynamic community and communicate in real-time
              </p>
              <div className={styles.actionButtons}>
                <button className={styles.mainButton} onClick={handleLogin}>
                  Login
                </button>
                <button className={styles.mainButton} onClick={handleSignUp}>
                  Signup
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
          <h2 className={styles.sectionTitle}>Our Features</h2>
          <div className={styles.featuresGrid}>
            {[
              { icon: '🔒', title: 'Secure', desc: 'End-to-end encryption' },
              { icon: '⚡', title: 'Fast', desc: 'Real-time communication' },
              { icon: '🌐', title: 'Global', desc: 'Accessible everywhere' },
              { icon: '📱', title: 'Responsive', desc: 'Mobile-friendly interface' },
              { icon: '🎨', title: 'Customizable', desc: 'Themes and avatars' },
              { icon: '📂', title: 'Media Sharing', desc: 'Share images, videos, and documents' },
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
          <h2 className={styles.sectionTitle}>Our Stats</h2>
          <div className={styles.statsGrid}>
            {[
              { number: '10k+', label: 'Active Users' },
              { number: '500k+', label: 'Messages Sent' },
              { number: '99.9%', label: 'Uptime' },
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
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <div className={styles.contactContent}>
            <p className={styles.contactText}>
              Ready to join us?
            </p>
            <button className={styles.mainButton}>
              Start Chatting
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
