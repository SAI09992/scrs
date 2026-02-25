import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { collection, getDocs, updateDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';

export default function AdminSubmissions() {
    const [submissions, setSubmissions] = useState([]);
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const q = query(collection(db, 'submissions'), orderBy('submitted_at', 'desc'));
        const snap = await getDocs(q);
        const items = [];
        for (const d of snap.docs) {
            const sub = { id: d.id, ...d.data() };
            try {
                if (sub.team_id) {
                    const teamSnap = await getDoc(doc(db, 'teams', sub.team_id));
                    sub.teams = teamSnap.exists() ? teamSnap.data() : null;
                }
            } catch { }
            items.push(sub);
        }
        setSubmissions(items);
    };

    const updateStatus = async (id, status) => {
        await updateDoc(doc(db, 'submissions', id), { status });
        loadData();
    };

    const toggleWindow = async (id, current) => {
        await updateDoc(doc(db, 'submissions', id), { is_window_open: !current });
        loadData();
    };

    const statusColor = { pending: '#fbbf24', valid: '#4ade80', invalid: '#ff6b6b' };

    return (
        <div style={{ maxWidth: '1000px' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '25px', textShadow: '0 0 8px rgba(255,140,0,0.3)' }}>
                SUBMISSION MONITORING
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {submissions.map((s) => (
                    <div key={s.id} style={{
                        background: 'rgba(0,10,20,0.4)', border: '1px solid rgba(255,140,0,0.1)',
                        borderRadius: '8px', padding: '20px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#fff' }}>{s.teams?.name}</div>
                                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'Not submitted'}
                                </div>
                            </div>
                            <span style={{
                                padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem',
                                background: `${statusColor[s.status]}15`, color: statusColor[s.status],
                                fontFamily: "'Rajdhani', sans-serif",
                            }}>
                                {s.status?.toUpperCase()}
                            </span>
                        </div>

                        {s.repo_link && (
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.55rem', color: 'rgba(255,140,0,0.5)', letterSpacing: '0.1em' }}>REPO: </span>
                                <a href={s.repo_link} target="_blank" rel="noopener noreferrer" style={{ color: '#0ff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem' }}>{s.repo_link}</a>
                            </div>
                        )}
                        {s.notes && (
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>{s.notes}</div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateStatus(s.id, 'valid')} style={{
                                padding: '5px 14px', borderRadius: '4px', cursor: 'pointer',
                                background: 'rgba(0,255,100,0.08)', border: '1px solid rgba(0,255,100,0.3)',
                                color: '#4ade80', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>VALID</button>
                            <button onClick={() => updateStatus(s.id, 'invalid')} style={{
                                padding: '5px 14px', borderRadius: '4px', cursor: 'pointer',
                                background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.3)',
                                color: '#ff6b6b', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>INVALID</button>
                            <button onClick={() => toggleWindow(s.id, s.is_window_open)} style={{
                                padding: '5px 14px', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>
                                {s.is_window_open ? 'CLOSE WINDOW' : 'REOPEN WINDOW'}
                            </button>
                        </div>
                    </div>
                ))}
                {submissions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Rajdhani', sans-serif" }}>
                        No submissions yet.
                    </div>
                )}
            </div>
        </div>
    );
}
