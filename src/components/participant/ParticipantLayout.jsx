import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ParticipantLayout() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [hasSelection, setHasSelection] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!profile?.team_id) return;
        const checkSelection = async () => {
            try {
                const q = query(collection(db, 'selections'), where('team_id', '==', profile.team_id));
                const snap = await getDocs(q);
                if (!snap.empty) setHasSelection(true);
            } catch { }
        };
        checkSelection();
    }, [profile?.team_id]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    const navItems = [
        { path: '/dashboard', label: 'HOME', icon: '🏠', end: true },
        { path: '/attendance', label: 'ATTENDANCE', icon: '📋' },
        { path: '/problems', label: hasSelection ? 'MY PS' : 'CHOOSE PS', icon: hasSelection ? '📄' : '🎯' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#02050a', overflow: 'hidden' }}>
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 15px', height: '56px', flexShrink: 0,
                background: 'linear-gradient(90deg, rgba(0,15,30,0.95), rgba(0,10,20,0.98))',
                borderBottom: '1px solid rgba(0,255,255,0.12)',
                fontFamily: "'Orbitron', sans-serif", zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ff', letterSpacing: '0.06em', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                        DEVFEST 2.0
                    </span>
                </div>

                <nav className="topnav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 12px', borderRadius: '6px',
                                textDecoration: 'none', fontSize: '0.55rem', letterSpacing: '0.06em',
                                color: isActive ? '#0ff' : 'rgba(255,255,255,0.5)',
                                background: isActive ? 'rgba(0,255,255,0.08)' : 'transparent',
                                borderBottom: isActive ? '2px solid #0ff' : '2px solid transparent',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                            })}
                        >
                            <span style={{ fontSize: '0.8rem' }}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button onClick={handleLogout} className="logout-btn-desktop" style={{
                        padding: '6px 12px', background: 'rgba(255,50,50,0.1)',
                        border: '1px solid rgba(255,50,50,0.25)', borderRadius: '5px',
                        color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.5rem', letterSpacing: '0.06em', cursor: 'pointer',
                    }}>
                        LOGOUT
                    </button>

                    <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} style={{
                        display: 'none', background: 'none', border: 'none', color: '#0ff',
                        fontSize: '1.4rem', cursor: 'pointer', padding: '4px',
                    }}>
                        {menuOpen ? '✖' : '☰'}
                    </button>
                </div>
            </header>

            {menuOpen && (
                <div className="mobile-menu" style={{
                    position: 'absolute', top: '56px', left: 0, right: 0, zIndex: 99,
                    background: 'rgba(0,10,20,0.98)', borderBottom: '1px solid rgba(0,255,255,0.15)',
                    padding: '10px 15px', display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setMenuOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '12px 15px', borderRadius: '6px',
                                textDecoration: 'none', fontFamily: "'Orbitron', sans-serif",
                                fontSize: '0.6rem', letterSpacing: '0.08em',
                                color: isActive ? '#0ff' : 'rgba(255,255,255,0.6)',
                                background: isActive ? 'rgba(0,255,255,0.08)' : 'transparent',
                            })}
                        >
                            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                    <button onClick={() => { setMenuOpen(false); handleLogout(); }} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 15px', borderRadius: '6px', width: '100%', textAlign: 'left',
                        background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)',
                        color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.6rem', letterSpacing: '0.08em', cursor: 'pointer', marginTop: '4px',
                    }}>
                        🚪 LOGOUT
                    </button>
                </div>
            )}

            <main style={{
                flex: 1, overflow: 'auto',
                backgroundImage: 'url("/Kalki-2898Ad.jpg")', backgroundSize: 'cover',
                backgroundPosition: 'center', backgroundAttachment: 'fixed',
                position: 'relative',
            }}>
                <div style={{ position: 'fixed', inset: 0, top: '56px', background: 'rgba(2,5,10,0.5)', zIndex: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Outlet />
                </div>
            </main>

            <style>{`
                @media (max-width: 640px) {
                    .topnav-desktop { display: none !important; }
                    .logout-btn-desktop { display: none !important; }
                    .hamburger-btn { display: block !important; }
                }
            `}</style>
        </div>
    );
}
