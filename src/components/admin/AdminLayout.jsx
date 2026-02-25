import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const navItems = [
    { path: '/admin', label: 'DASHBOARD', icon: '⬡', end: true },
    { path: '/admin/problems', label: 'PROBLEMS', icon: '◈' },
    { path: '/admin/teams', label: 'TEAMS', icon: '⬢' },
    { path: '/admin/upload-teams', label: 'UPLOAD', icon: '📤' },
    { path: '/admin/credentials', label: 'CREDENTIALS', icon: '🔑' },
    { path: '/admin/selections', label: 'SELECTIONS', icon: '◉' },

    { path: '/admin/reviews', label: 'REVIEWS', icon: '★' },
    { path: '/admin/attendance', label: 'ATTENDANCE', icon: '📋' },
    { path: '/admin/evaluation', label: 'EVALUATION', icon: '⚖️' },
    { path: '/admin/timeline', label: 'TIMELINE', icon: '⏳' },
    { path: '/admin/announcements', label: 'ANNOUNCE', icon: '📢' },
    { path: '/admin/audio', label: 'AUDIO', icon: '🎵' },
    { path: '/admin/reports', label: 'REPORTS', icon: '▤' },
];

export default function AdminLayout() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#02050a', overflow: 'hidden' }}>
            {/* Mobile top bar */}
            <div className="admin-mobile-bar" style={{
                display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '50px',
                background: 'rgba(20,8,0,0.98)', borderBottom: '1px solid rgba(255,140,0,0.2)',
                zIndex: 200, alignItems: 'center', justifyContent: 'space-between', padding: '0 15px',
            }}>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#ff8c00', fontWeight: 700 }}>ADMIN</span>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#ff8c00', fontSize: '1.4rem', cursor: 'pointer' }}>
                    {sidebarOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Sidebar overlay on mobile */}
            {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 249 }} />}

            {/* Sidebar */}
            <aside className="admin-sidebar" style={{
                width: '220px', flexShrink: 0, height: '100vh',
                background: 'linear-gradient(180deg, rgba(20,8,0,0.95) 0%, rgba(5,2,0,0.98) 100%)',
                borderRight: '1px solid rgba(255,140,0,0.2)',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'Orbitron', sans-serif",
                transition: 'transform 0.3s ease',
            }}>
                {/* Logo */}
                <div style={{ padding: '20px 15px', borderBottom: '1px solid rgba(255,140,0,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ff8c00', letterSpacing: '0.08em', textShadow: '0 0 15px rgba(255,140,0,0.4)' }}>ADMIN PORTAL</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.7rem', color: 'rgba(255,200,150,0.4)', letterSpacing: '0.1em', marginTop: '3px' }}>CONTROL CENTER</div>
                </div>

                {/* Admin Info */}
                <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(255,140,0,0.1)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,140,0,0.5)', letterSpacing: '0.1em', marginBottom: '3px' }}>LOGGED IN AS</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: '#fff' }}>{profile?.full_name || 'Admin'}</div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '9px 14px', margin: '1px 6px', borderRadius: '5px',
                                textDecoration: 'none', fontSize: '0.58rem', letterSpacing: '0.06em',
                                color: isActive ? '#ff8c00' : 'rgba(255,255,255,0.45)',
                                background: isActive ? 'rgba(255,140,0,0.1)' : 'transparent',
                                borderLeft: isActive ? '2px solid #ff8c00' : '2px solid transparent',
                                transition: 'all 0.2s ease',
                            })}
                        >
                            <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div style={{ padding: '12px 15px', borderTop: '1px solid rgba(255,140,0,0.15)' }}>
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: '9px', background: 'rgba(255,50,50,0.1)',
                        border: '1px solid rgba(255,50,50,0.3)', borderRadius: '5px',
                        color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.58rem', letterSpacing: '0.08em', cursor: 'pointer',
                    }}>
                        LOGOUT
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main" style={{
                flex: 1, overflow: 'auto', padding: '25px',
                background: 'radial-gradient(ellipse at top, rgba(30,15,0,0.2) 0%, rgba(2,5,10,0.6) 70%)',
            }}>
                <Outlet />
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .admin-mobile-bar { display: flex !important; }
                    .admin-sidebar-overlay { display: block !important; }
                    .admin-sidebar {
                        position: fixed !important; top: 50px !important; left: 0 !important;
                        bottom: 0 !important; z-index: 250 !important; height: auto !important;
                        transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
                    }
                    .admin-main { padding: 15px !important; margin-top: 50px !important; }
                }
            `}</style>
        </div>
    );
}
