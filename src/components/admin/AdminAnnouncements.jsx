import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';

export default function AdminAnnouncements() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState({ title: '', message: '', priority: 'info' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const handleBroadcast = async () => {
        await addDoc(collection(db, 'announcements'), { ...form, created_by: user?.id, created_at: serverTimestamp() });
        setForm({ title: '', message: '', priority: 'info' });
        loadData();
    };

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, 'announcements', id));
        loadData();
    };

    const priorityColor = { info: '#0ff', warning: '#fbbf24', urgent: '#ff6b6b' };

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,140,0,0.2)', borderRadius: '6px',
        color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', outline: 'none',
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '25px', textShadow: '0 0 8px rgba(255,140,0,0.3)' }}>
                ANNOUNCEMENTS
            </h2>

            <div style={{ background: 'rgba(20,8,0,0.3)', border: '1px solid rgba(255,140,0,0.15)', borderRadius: '8px', padding: '25px', marginBottom: '25px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>TITLE</label>
                        <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>PRIORITY</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>MESSAGE</label>
                    <textarea style={{ ...inputStyle, minHeight: '80px' }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <button onClick={handleBroadcast} style={{
                    padding: '10px 24px', borderRadius: '6px', cursor: 'pointer',
                    background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.4)',
                    color: '#ff8c00', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em',
                }}>
                    📢 BROADCAST
                </button>
            </div>

            {announcements.map((a) => (
                <div key={a.id} style={{
                    background: 'rgba(0,10,20,0.4)', border: `1px solid ${priorityColor[a.priority]}30`,
                    borderRadius: '8px', padding: '15px 20px', marginBottom: '10px',
                    borderLeft: `3px solid ${priorityColor[a.priority]}`,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: priorityColor[a.priority], letterSpacing: '0.08em' }}>
                            {a.title || a.priority.toUpperCase()}
                        </div>
                        <button onClick={() => handleDelete(a.id)} style={{
                            padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                            background: 'transparent', border: '1px solid rgba(255,50,50,0.3)',
                            color: '#ff6b6b', fontSize: '0.5rem', fontFamily: "'Orbitron', sans-serif",
                        }}>✕</button>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                        {a.message}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '6px' }}>
                        {a.created_at?.toDate ? new Date(a.created_at.toDate()).toLocaleString() : ''}
                    </div>
                </div>
            ))}
        </div>
    );
}
