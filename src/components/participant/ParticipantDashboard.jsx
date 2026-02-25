import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebaseClient';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const K = {
    bg: '#02050a',
    gold: '#d4a853',
    cyan: '#0ff',
    amber: '#ff8c00',
    card: 'rgba(10,15,25,0.85)',
    border: 'rgba(212,168,83,0.25)',
    text: 'rgba(255,255,255,0.85)',
    dim: 'rgba(255,255,255,0.5)',
};

const BUJJI_FAQS = [
    { q: "What is DevFest 2.0?", a: "DevFest 2.0 – Kalki 2898 AD is a 24-hour hackathon where warriors of Shambhala code their way to glory! Teams compete to solve real-world problems with innovative solutions." },
    { q: "How big can teams be?", a: "Each team can have 2-4 members. Choose your allies wisely, warrior! You'll need a good mix of skills to survive The Complex." },
    { q: "What should we bring?", a: "Your laptop, charger, extension box, and warrior spirit! We provide the WiFi, power, and snacks. Bujji recommends bringing a water bottle and earphones too!" },
    { q: "Can we use pre-built code?", a: "Open-source libraries and frameworks are allowed, but your core solution must be built during the hackathon. Bujji's watching! No pre-built projects." },
    { q: "Are snacks and drinks provided?", a: "Yes! Snacks and drinks will be available throughout the hackathon to keep you fueled. Stay hydrated, warrior!" },
];

export default function ParticipantDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const annQ = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(3));
                const annSnap = await getDocs(annQ);
                setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch { }

            try {
                const tlSnap = await getDoc(doc(db, 'event_timeline', 'global'));
                if (tlSnap.exists() && tlSnap.data().items) {
                    setTimeline(tlSnap.data().items);
                }
            } catch { /* fallback to empty timeline */ }
        };
        load();
    }, []);

    const team = profile?.teams;
    const members = typeof team?.members === 'string' ? JSON.parse(team.members) : (team?.members || []);

    const timelineData = timeline.map((t) => ({ time: t.time || 'TBA', title: t.title, desc: t.description, is_current: t.is_current }));

    const icons = ['🚀', '🎯', '⚔️', '💻', '🍱', '🔍', '🌙', '⚡', '🎤', '🏆', '🌟'];

    const SectionTitle = ({ icon, title, subtitle }) => (
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{icon}</div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: K.gold, letterSpacing: '0.15em', margin: 0, textShadow: '0 0 20px rgba(212,168,83,0.3)' }}>{title}</h2>
            {subtitle && <p style={{ fontFamily: "'Rajdhani', sans-serif", color: K.dim, fontSize: '1.1rem', marginTop: '8px' }}>{subtitle}</p>}
            <div style={{ width: '80px', height: '2px', background: `linear-gradient(90deg, transparent, ${K.gold}, transparent)`, margin: '15px auto 0' }} />
        </div>
    );

    return (
        <div style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif" }}>

            {/* ═══════════ HERO ═══════════ */}
            <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                {/* Presented By + SCRS Logo */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: K.dim, letterSpacing: '0.4em', marginBottom: '12px' }}>PRESENTED BY</div>
                    <img
                        src="/images/scrs-logo.png"
                        alt="SCRS"
                        style={{
                            width: '90px', height: '90px', borderRadius: '50%',
                            border: `2px solid ${K.gold}`, objectFit: 'cover',
                            boxShadow: '0 0 20px rgba(212,168,83,0.3)',
                            display: 'block', margin: '0 auto',
                        }}
                    />
                </div>

                {/* Title */}
                <h1 style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                    fontWeight: 900, letterSpacing: '0.08em', margin: '0 0 10px',
                    background: `linear-gradient(180deg, ${K.gold} 0%, #b8860b 50%, ${K.amber} 100%)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 30px rgba(212,168,83,0.4))',
                }}>
                    DEVFEST 2.0
                </h1>
                <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(0.8rem, 2vw, 1.2rem)', color: K.dim, letterSpacing: '0.4em', marginBottom: '50px' }}>
                    K A L K I &nbsp; 2 8 9 8 &nbsp; A D
                </p>

                {/* Team Card */}
                <div style={{
                    maxWidth: '480px', width: '100%', padding: '28px 30px',
                    background: K.card, border: `2px solid ${K.border}`, borderRadius: '12px',
                    backdropFilter: 'blur(10px)', boxShadow: '0 0 40px rgba(212,168,83,0.08)',
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🛡️</div>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem', color: K.gold, letterSpacing: '0.12em', margin: '0 0 5px' }}>
                        {team?.name || 'TEAM NOT ASSIGNED'}
                    </h3>
                    <div style={{
                        display: 'inline-block', padding: '3px 14px', borderRadius: '20px', fontSize: '0.75rem',
                        background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.25)', color: K.cyan,
                        fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em', marginBottom: '15px',
                    }}>
                        CODE: {team?.team_code || '—'}
                    </div>

                    <div style={{ borderTop: `1px solid ${K.border}`, paddingTop: '12px' }}>
                        {members.length > 0 ? members.map((m, i) => (
                            <div key={i} style={{ padding: '8px 0', borderBottom: i < members.length - 1 ? `1px solid rgba(212,168,83,0.08)` : 'none' }}>
                                <div style={{ color: K.text, fontSize: '1rem', fontWeight: 600 }}>{m.name}</div>
                                {m.reg_no && <div style={{ color: K.dim, fontSize: '0.8rem', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>{m.reg_no}</div>}
                            </div>
                        )) : (
                            <p style={{ color: K.dim, margin: '10px 0 0' }}>Team details will be assigned by admin</p>
                        )}
                    </div>
                </div>

            </section>

            {/* ═══════════ ANNOUNCEMENTS ═══════════ */}
            {announcements.length > 0 && (
                <section style={{ padding: '25px 20px', background: 'rgba(212,168,83,0.06)', borderTop: `1px solid ${K.border}`, borderBottom: `1px solid ${K.border}` }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {announcements.map((a) => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
                                <span style={{ color: a.priority === 'urgent' ? '#ff6b6b' : a.priority === 'warning' ? '#fbbf24' : K.cyan, fontSize: '0.8rem' }}>
                                    {a.priority === 'urgent' ? '🔴' : a.priority === 'warning' ? '⚠️' : '📢'}
                                </span>
                                <span style={{ color: K.text, fontSize: '1rem' }}>{a.message}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ═══════════ THE MISSION ═══════════ */}
            <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
                <SectionTitle icon="⚔️" title="THE MISSION" subtitle="What awaits warriors of Shambhala" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {[
                        { icon: '🎯', title: 'Bounty Missions', desc: 'Navigate through challenging real-world bounty missions. Choose your battleground wisely.' },
                        { icon: '⏱️', title: '24-Hour Sprint', desc: 'Survive the 24-hour coding marathon. Build, iterate, and deploy under pressure.' },
                        { icon: '⚖️', title: 'Expert Judging', desc: 'Your solutions evaluated by industry experts and seasoned judges on multiple criteria.' },
                        { icon: '🧠', title: 'Mentorship', desc: 'Guidance from industry veterans and faculty mentors throughout the event.' },
                        { icon: '🌐', title: 'Networking', desc: 'Connect with fellow developers, share ideas, and forge alliances that last.' },
                        { icon: '📜', title: 'Certification', desc: 'Every warrior receives an official certificate of participation from SCRS.' },
                    ].map((f, i) => (
                        <div key={i} style={{
                            padding: '28px', background: K.card, border: `1px solid ${K.border}`, borderRadius: '10px',
                            transition: 'all 0.3s ease', cursor: 'default',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = K.gold; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = K.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{f.icon}</div>
                            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', color: K.gold, letterSpacing: '0.08em', margin: '0 0 10px' }}>{f.title}</h3>
                            <p style={{ color: K.dim, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════ PRIZE POOL ═══════════ */}
            <section style={{ padding: '80px 20px' }}>
                <SectionTitle icon="💎" title="THE BOUNTY" subtitle="Total Prize Pool: ₹6,000" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '400px', margin: '0 auto' }}>
                    {/* 1st Place */}
                    <div style={{
                        width: '280px', padding: '45px 30px', textAlign: 'center',
                        background: 'rgba(20,15,5,0.9)', border: `2px solid ${K.gold}`,
                        borderRadius: '14px', boxShadow: `0 0 40px rgba(212,168,83,0.15)`, transform: 'scale(1.05)',
                    }}>
                        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', color: K.gold, letterSpacing: '0.15em', marginBottom: '15px' }}>SUPREME WARRIOR</h3>
                        <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🏆</div>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2.5rem', color: K.gold, fontWeight: 700 }}>₹3,000</div>
                        <div style={{ display: 'inline-block', padding: '5px 18px', borderRadius: '20px', marginTop: '10px', background: `rgba(212,168,83,0.15)`, border: `1px solid ${K.gold}40`, fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: K.gold, letterSpacing: '0.15em' }}>1ST PLACE</div>
                    </div>
                    {/* 2nd Place */}
                    <div style={{
                        width: '250px', padding: '35px 25px', textAlign: 'center',
                        background: K.card, border: '1px solid rgba(192,192,192,0.3)', borderRadius: '12px',
                    }}>
                        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#c0c0c0', letterSpacing: '0.12em', marginBottom: '15px' }}>SILVER WARRIOR</h3>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🥈</div>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2rem', color: '#c0c0c0', fontWeight: 700 }}>₹2,000</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: K.dim, fontSize: '0.9rem', marginTop: '5px' }}>2ND PLACE</div>
                    </div>
                    {/* 3rd Place */}
                    <div style={{
                        width: '250px', padding: '35px 25px', textAlign: 'center',
                        background: K.card, border: '1px solid rgba(205,127,50,0.3)', borderRadius: '12px',
                    }}>
                        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#cd7f32', letterSpacing: '0.12em', marginBottom: '15px' }}>BRONZE WARRIOR</h3>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🥉</div>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2rem', color: '#cd7f32', fontWeight: 700 }}>₹1,000</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: K.dim, fontSize: '0.9rem', marginTop: '5px' }}>3RD PLACE</div>
                    </div>
                </div>

                {/* Rewards */}
                <div style={{ maxWidth: '700px', margin: '50px auto 0', padding: '30px', background: K.card, border: `1px solid ${K.border}`, borderRadius: '10px' }}>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', color: K.gold, letterSpacing: '0.1em', marginBottom: '15px', textAlign: 'center' }}>REWARDS FOR ALL WARRIORS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {['Official Certificate of Participation', 'Mentoring by Experts', 'Free Refreshments', '1 EE Credit'].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                                <span style={{ color: K.gold }}>◆</span>
                                <span style={{ color: K.text, fontSize: '0.95rem' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ BOUNTY HUNT ═══════════ */}
            <section style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
                <SectionTitle icon="🗺️" title="BOUNTY HUNT" subtitle="The hidden challenge within The Complex" />
                <div style={{
                    padding: '35px', background: K.card, border: `1px solid ${K.border}`, borderRadius: '12px',
                    textAlign: 'center', boxShadow: '0 0 30px rgba(0,255,255,0.05)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏴‍☠️</div>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: K.cyan, letterSpacing: '0.1em', margin: '0 0 12px' }}>THE QUEST OF SHAMBHALA</h3>
                    <p style={{ color: K.text, fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 20px' }}>
                        Between coding sessions, embark on a thrilling bounty hunt across the venue!
                        Solve cryptic clues inspired by the world of Kalki, find hidden artifacts, and earn bonus glory for your team.
                    </p>
                    <div style={{
                        display: 'inline-block', padding: '10px 25px', borderRadius: '8px',
                        background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.2)',
                        fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: K.cyan, letterSpacing: '0.15em',
                    }}>
                        TIMINGS TO BE ANNOUNCED
                    </div>
                </div>
            </section>

            {/* ═══════════ TIMELINE (from DB) ═══════════ */}
            <section style={{ padding: '80px 20px' }}>
                <SectionTitle icon="⏳" title="THE JOURNEY" subtitle="Your path through The Complex" />
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, transparent, ${K.gold}40, ${K.gold}40, transparent)` }} />
                    {timelineData.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end', position: 'relative', marginBottom: '30px', padding: '0 10px' }}>
                            <div style={{
                                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                                width: '44px', height: '44px', borderRadius: '50%', background: item.is_current ? K.bg : K.bg,
                                border: `2px solid ${item.is_current ? K.cyan : K.gold + '50'}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', zIndex: 2,
                                boxShadow: item.is_current ? '0 0 15px rgba(0,255,255,0.4)' : 'none',
                                animation: item.is_current ? 'pulse 2s infinite' : 'none',
                            }}>
                                {icons[i] || '⭐'}
                            </div>
                            <div style={{
                                width: 'calc(50% - 50px)', padding: '18px 22px',
                                background: item.is_current ? 'rgba(0,255,255,0.05)' : K.card,
                                border: `1px solid ${item.is_current ? 'rgba(0,255,255,0.3)' : K.border}`, borderRadius: '10px',
                                textAlign: i % 2 === 0 ? 'right' : 'left',
                                boxShadow: item.is_current ? '0 0 20px rgba(0,255,255,0.1)' : 'none',
                            }}>
                                {item.is_current && <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.5rem', color: K.cyan, letterSpacing: '0.2em', marginBottom: '4px' }}>▶ HAPPENING NOW</div>}
                                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: K.gold, letterSpacing: '0.12em', marginBottom: '4px' }}>{item.time}</div>
                                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.title}</div>
                                <div style={{ color: K.dim, fontSize: '0.9rem' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════ BUJJI FAQ ═══════════ */}
            <section style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
                <SectionTitle icon="🤖" title="ASK BUJJI" subtitle="Your AI companion answers all questions" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {BUJJI_FAQS.map((faq, i) => (
                        <div key={i} style={{ background: K.card, border: `1px solid ${openFaq === i ? K.cyan + '50' : K.border}`, borderRadius: '10px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 22px', background: 'transparent', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: openFaq === i ? K.cyan : K.text, letterSpacing: '0.05em', textAlign: 'left' }}>{faq.q}</span>
                                <span style={{ color: K.gold, fontSize: '1.2rem', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>+</span>
                            </button>
                            {openFaq === i && (
                                <div style={{ padding: '0 22px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🤖</div>
                                    <div>
                                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.55rem', color: K.cyan, letterSpacing: '0.15em', display: 'block', marginBottom: '5px' }}>BUJJI SAYS:</span>
                                        <p style={{ color: K.text, fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════ ACTIONS ═══════════ */}
            <section style={{ padding: '60px 20px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/problems')} style={{ padding: '14px 35px', borderRadius: '8px', cursor: 'pointer', background: `linear-gradient(135deg, rgba(212,168,83,0.2), rgba(212,168,83,0.05))`, border: `1px solid ${K.gold}60`, color: K.gold, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                        ⚔️ BROWSE PROBLEMS
                    </button>
                    <button onClick={() => navigate('/activities')} style={{ padding: '14px 35px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.25)', color: K.cyan, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                        🎮 ACTIVITIES
                    </button>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: `1px solid ${K.border}`, background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: K.gold, letterSpacing: '0.15em', marginBottom: '8px' }}>DEVFEST 2.0 – KALKI 2898 AD</div>
                <div style={{ color: K.dim, fontSize: '0.85rem' }}>Organized by SCRS &nbsp;•&nbsp; Powered by Shambhala Tech</div>
            </footer>

            <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes scrollDot { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(10px); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 10px rgba(0,255,255,0.3); } 50% { box-shadow: 0 0 25px rgba(0,255,255,0.6); } }
      `}</style>
        </div>
    );
}
