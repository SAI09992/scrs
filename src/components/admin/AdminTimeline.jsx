import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const S = { gold: '#ff8c00', card: 'rgba(15,10,5,0.85)', border: 'rgba(255,140,0,0.2)', text: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.5)' };

export async function loadTimeline() {
    try {
        const snap = await getDoc(doc(db, 'event_timeline', 'global'));
        if (snap.exists() && snap.data().items) {
            return snap.data().items;
        }
    } catch { }
    return [];
}

export default function AdminTimeline() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', time: '' });
    const [editing, setEditing] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        const data = await loadTimeline();
        setItems(data);
    };

    const saveAll = async (newItems) => {
        await setDoc(doc(db, 'event_timeline', 'global'), { items: newItems }, { merge: true });
        setItems(newItems);
    };

    const save = () => {
        if (!form.title) return;
        const newItems = [...items];
        const entry = { title: form.title, description: form.description, time: form.time, is_current: false };

        if (editing !== null) {
            entry.is_current = newItems[editing]?.is_current || false;
            newItems[editing] = entry;
        } else {
            newItems.push(entry);
        }
        saveAll(newItems);
        setForm({ title: '', description: '', time: '' });
        setEditing(null);
    };

    const remove = (idx) => {
        const newItems = items.filter((_, i) => i !== idx);
        saveAll(newItems);
    };

    const setCurrent = (idx) => {
        const newItems = items.map((item, i) => ({ ...item, is_current: i === idx }));
        saveAll(newItems);
    };

    const moveUp = (idx) => {
        if (idx === 0) return;
        const newItems = [...items];
        [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
        saveAll(newItems);
    };

    const moveDown = (idx) => {
        if (idx === items.length - 1) return;
        const newItems = [...items];
        [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
        saveAll(newItems);
    };

    const inputStyle = { width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: '6px', color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem' };

    return (
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: S.gold, letterSpacing: '0.1em', marginBottom: '25px' }}>⏳ TIMELINE MANAGEMENT</h2>

            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px', marginBottom: '25px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>TITLE</label>
                        <input placeholder="e.g. Opening Ceremony" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>TIME</label>
                        <input placeholder="e.g. 10:00 AM" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inputStyle} />
                    </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>DESCRIPTION</label>
                    <input placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                </div>
                <button onClick={save} style={{ padding: '10px 25px', background: 'rgba(255,140,0,0.15)', border: `1px solid ${S.gold}`, borderRadius: '6px', color: S.gold, fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.08em' }}>
                    {editing !== null ? '✏️ UPDATE' : '➕ ADD STAGE'}
                </button>
                {editing !== null && <button onClick={() => { setEditing(null); setForm({ title: '', description: '', time: '' }); }} style={{ marginLeft: '10px', padding: '10px 20px', background: 'transparent', border: `1px solid ${S.dim}`, borderRadius: '6px', color: S.dim, fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', cursor: 'pointer' }}>CANCEL</button>}
            </div>

            {items.map((item, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
                    background: item.is_current ? 'rgba(0,255,255,0.05)' : S.card,
                    border: `1px solid ${item.is_current ? 'rgba(0,255,255,0.3)' : S.border}`,
                    borderRadius: '8px', marginBottom: '8px',
                }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, minWidth: '25px' }}>{i + 1}.</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{item.title}</span>
                            {item.is_current && <span style={{ fontSize: '0.55rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,255,255,0.15)', color: '#0ff', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>CURRENT</span>}
                        </div>
                        <div style={{ color: S.dim, fontSize: '0.85rem' }}>
                            {item.time && <span style={{ color: S.gold, marginRight: '8px' }}>{item.time}</span>}
                            {item.description}
                        </div>
                    </div>
                    <button onClick={() => setCurrent(i)} title="Set as current" style={{ background: 'none', border: 'none', color: item.is_current ? '#0ff' : S.dim, cursor: 'pointer', fontSize: '1rem' }}>📍</button>
                    <button onClick={() => moveUp(i)} style={{ background: 'none', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '0.9rem' }}>▲</button>
                    <button onClick={() => moveDown(i)} style={{ background: 'none', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '0.9rem' }}>▼</button>
                    <button onClick={() => { setEditing(i); setForm({ title: item.title, description: item.description || '', time: item.time || '' }); }} style={{ background: 'none', border: 'none', color: S.gold, cursor: 'pointer', fontSize: '1rem' }}>✏️</button>
                    <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                </div>
            ))}
            {items.length === 0 && <p style={{ color: S.dim, textAlign: 'center', padding: '30px' }}>No timeline entries yet. Add stages above.</p>}
        </div>
    );
}
