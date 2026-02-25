import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import IntroVideo from './IntroVideo';

export default function LoginPage() {
    const { signIn, teamLogin, user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [credential, setCredential] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showIntro, setShowIntro] = useState(false);
    const [pendingRedirect, setPendingRedirect] = useState(null);

    const isEmailMode = credential.includes('@');

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!authLoading && user && profile) {
            const dest = profile.role === 'admin' ? '/admin' : '/dashboard';
            const alreadySeen = sessionStorage.getItem('intro_seen');
            if (alreadySeen) {
                navigate(dest, { replace: true });
            } else {
                setPendingRedirect(dest);
                setShowIntro(true);
            }
        }
    }, [user, profile, authLoading, navigate]);

    const handleIntroComplete = useCallback(() => {
        sessionStorage.setItem('intro_seen', '1');
        setShowIntro(false);
        if (pendingRedirect) navigate(pendingRedirect, { replace: true });
    }, [pendingRedirect, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            sessionStorage.removeItem('intro_seen');
            if (isEmailMode) {
                await signIn(credential, password);
            } else {
                await teamLogin(credential);
            }
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setSubmitting(false);
        }
    };

    if (showIntro) {
        return <IntroVideo onComplete={handleIntroComplete} />;
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, width: '100vw', height: '100vh',
            background: '#02050a', overflow: 'hidden',
        }}>
            <video
                autoPlay muted loop playsInline
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', zIndex: 0,
                }}
                src="/videos/login-bg.mp4"
            />
            <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'linear-gradient(to top, rgba(0,10,20,0.85) 0%, rgba(0,10,20,0.4) 40%, rgba(0,10,20,0.3) 100%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            }}>
                <div className="sci-fi-panel" style={{
                    width: '90%', maxWidth: '400px', padding: '35px 40px 40px 40px',
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateY(0)' : 'translateY(40px)',
                    transition: 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s',
                }}>
                    <h1 style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 700,
                        color: '#e0e0e0', textAlign: 'center',
                        letterSpacing: '0.05em', marginBottom: '10px',
                        textTransform: 'uppercase',
                        textShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                    }}>
                        <span style={{ color: '#ffcc80' }}>ENTER</span>{' '}
                        <span style={{ color: '#00ffff' }}>SHAMBHALA</span>
                    </h1>

                    <p style={{
                        fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
                        color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center',
                        letterSpacing: '0.1em', marginBottom: '40px',
                    }}>
                        DevFest 2.0 - Kalki 2898 AD
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {error && (
                            <div style={{
                                background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.4)',
                                borderRadius: '6px', padding: '10px 15px',
                                color: '#ff6b6b', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem',
                            }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="sci-fi-label">{isEmailMode ? 'EMAIL' : 'TEAM CODE'}</label>
                            <div className="sci-fi-input-wrapper">
                                <div className="sci-fi-icon">
                                    {isEmailMode ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                            <path d="M22 7l-10 7L2 7"></path>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="text" className="sci-fi-input"
                                    placeholder="Enter team code..."
                                    value={credential}
                                    onChange={(e) => setCredential(isEmailMode ? e.target.value : e.target.value.toUpperCase())}
                                    required autoFocus
                                />
                            </div>
                        </div>

                        {/* Password field appears only for email (admin) login */}
                        {isEmailMode && (
                            <div style={{ marginBottom: '15px' }}>
                                <label className="sci-fi-label">PASSWORD</label>
                                <div className="sci-fi-input-wrapper">
                                    <div className="sci-fi-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            <path d="M12 15v2" stroke="currentColor" strokeWidth="2"></path>
                                        </svg>
                                    </div>
                                    <input
                                        type="password" className="sci-fi-input"
                                        placeholder="Enter password..."
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '60%' }}>
                                <button type="submit" className="sci-fi-btn" disabled={submitting}>
                                    {submitting ? (isEmailMode ? 'AUTHENTICATING...' : 'VERIFYING...') : 'ENTER'}
                                </button>
                            </div>
                        </div>

                        {isEmailMode && (
                            <div style={{ textAlign: 'center', marginTop: '5px' }}>
                                <Link to="/forgot-password" className="sci-fi-link" style={{
                                    fontSize: '0.85rem', letterSpacing: '0.05em',
                                }}>
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
