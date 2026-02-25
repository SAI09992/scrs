import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

export default function AdminSelections() {
    const [selections, setSelections] = useState([]);
    const [tab, setTab] = useState('all');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const snap = await getDocs(collection(db, 'selections'));
            const items = [];
            for (const d of snap.docs) {
                const sel = { id: d.id, ...d.data() };
                try {
                    if (sel.team_id) {
                        const teamSnap = await getDoc(doc(db, 'teams', sel.team_id));
                        sel.teams = teamSnap.exists() ? teamSnap.data() : null;
                    }
                    if (sel.problem_id) {
                        const probSnap = await getDoc(doc(db, 'problems', sel.problem_id));
                        sel.problems = probSnap.exists() ? probSnap.data() : null;
                    }
                } catch { }
                items.push(sel);
            }
            items.sort((a, b) => new Date(b.selected_at || 0) - new Date(a.selected_at || 0));
            setSelections(items);
        } catch (error) {
            console.error('Failed to load selections:', error);
            alert('Error loading selections. Check console.');
        }
    };

    const toggleLock = async (id, current) => {
        try {
            await updateDoc(doc(db, 'selections', id), { locked_at: current ? null : new Date().toISOString() });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Failed to update selection lock status: ' + error.message);
        }
    };

    const deleteSelection = async (id) => {
        if (!window.confirm('Remove this selection?')) return;
        try {
            await deleteDoc(doc(db, 'selections', id));
            loadData();
        } catch (error) {
            console.error(error);
            alert('Failed to delete selection: ' + error.message);
        }
    };

    const locked = selections.filter(s => s.locked_at);
    const unlocked = selections.filter(s => !s.locked_at);

    const filtered = tab === 'locked' ? locked : tab === 'unlocked' ? unlocked : selections;

    const tabBtn = (key, label, count, color) => (
        <button onClick={() => setTab(key)} style={{
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            background: tab === key ? `rgba(${color},0.15)` : 'transparent',
            border: `1px solid ${tab === key ? `rgba(${color},0.4)` : 'rgba(255,255,255,0.1)'}`,
            color: tab === key ? `rgb(${color})` : 'rgba(255,255,255,0.4)',
            fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', letterSpacing: '0.08em',
        }}>
            {label} ({count})
        </button>
    );

    return (
        <div style={{ maxWidth: '1000px' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '25px', textShadow: '0 0 8px rgba(255,140,0,0.3)' }}>
                PROBLEM SELECTIONS
            </h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {tabBtn('all', 'ALL', selections.length, '255,140,0')}
                {tabBtn('locked', 'LOCKED', locked.length, '0,255,100')}
                {tabBtn('unlocked', 'UNLOCKED', unlocked.length, '255,180,0')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map((s) => (
                    <div key={s.id} style={{
                        background: 'rgba(0,10,20,0.4)', border: '1px solid rgba(255,140,0,0.1)',
                        borderRadius: '8px', padding: '15px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#fff' }}>{s.teams?.name || 'Unknown'}</div>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: '#ff8c00', marginTop: '2px' }}>{s.problems?.title || 'Unknown'}</div>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                                {s.selected_at ? new Date(s.selected_at).toLocaleString() : ''}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => toggleLock(s.id, s.locked_at)} style={{
                                padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.55rem',
                                fontFamily: "'Orbitron', sans-serif",
                                background: s.locked_at ? 'rgba(0,255,100,0.08)' : 'rgba(255,180,0,0.08)',
                                border: `1px solid ${s.locked_at ? 'rgba(0,255,100,0.3)' : 'rgba(255,180,0,0.3)'}`,
                                color: s.locked_at ? '#4ade80' : '#fbbf24',
                            }}>{s.locked_at ? '🔓 UNLOCK' : '🔒 LOCK'}</button>
                            <button onClick={() => deleteSelection(s.id)} style={{
                                padding: '5px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid rgba(255,50,50,0.3)',
                                color: '#ff6b6b', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>DEL</button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Rajdhani', sans-serif" }}>
                        No selections yet.
                    </div>
                )}
            </div>
        </div>
    );
}
