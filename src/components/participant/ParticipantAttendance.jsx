import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

export default function ParticipantAttendance() {
    const { profile } = useAuth();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.team_id) return;
        loadData();
    }, [profile]);

    const loadData = async () => {
        try {
            const teamSnap = await getDoc(doc(db, 'teams', profile.team_id));
            if (teamSnap.exists()) setTeam({ id: teamSnap.id, ...teamSnap.data() });
        } catch { }
        setLoading(false);
    };

    const S = { gold: '#ff8c00', border: 'rgba(255,140,0,0.2)', dim: 'rgba(255,255,255,0.5)' };

    if (loading) return <p style={{ color: S.dim, fontFamily: "'Rajdhani', sans-serif" }}>Loading...</p>;
    if (!team) return <p style={{ color: S.dim, fontFamily: "'Rajdhani', sans-serif" }}>Team not found.</p>;

    const members = typeof team.members === 'string' ? JSON.parse(team.members) : (team.members || []);

    return (
        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: "'Rajdhani', sans-serif" }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.4rem', color: S.gold, letterSpacing: '0.12em', margin: 0 }}>ATTENDANCE</h2>
                <p style={{ color: S.dim, marginTop: '6px' }}>Your team's attendance across all rounds</p>
            </div>

            <div style={{ background: 'rgba(15,10,5,0.85)', border: `1px solid ${S.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                            <th style={{ padding: '14px 18px', textAlign: 'left', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: S.gold, letterSpacing: '0.1em' }}>MEMBER</th>
                            <th style={{ padding: '14px 18px', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: S.gold, letterSpacing: '0.1em' }}>R1</th>
                            <th style={{ padding: '14px 18px', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: S.gold, letterSpacing: '0.1em' }}>R2</th>
                            <th style={{ padding: '14px 18px', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: S.gold, letterSpacing: '0.1em' }}>R3</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m, i) => (
                            <tr key={i} style={{ borderBottom: i < members.length - 1 ? `1px solid rgba(255,140,0,0.06)` : 'none' }}>
                                <td style={{ padding: '12px 18px' }}>
                                    <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
                                        {i === 0 ? '👑 ' : ''}{m.name}
                                    </div>
                                    {m.reg_no && <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: '#0ff', marginTop: '2px' }}>{m.reg_no}</div>}
                                </td>
                                {[1, 2, 3].map(r => (
                                    <td key={r} style={{ padding: '12px 18px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            fontFamily: "'Rajdhani', sans-serif",
                                            color: m[`r${r}`] ? '#4ade80' : '#ff6b6b',
                                        }}>
                                            {m[`r${r}`] ? '✅' : '❌'}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
