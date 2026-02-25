import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';

export default function AdminTeams() {
    const [teams, setTeams] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', team_code: '', members: '' });

    useEffect(() => { loadTeams(); }, []);

    const loadTeams = async () => {
        const snap = await getDocs(collection(db, 'teams'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => new Date(b.created_at?.seconds * 1000 || 0) - new Date(a.created_at?.seconds * 1000 || 0));
        setTeams(items);
    };

    const handleSave = async () => {
        const data = {
            name: form.name,
            team_code: form.team_code.toUpperCase(),
            members: form.members ? JSON.parse(form.members) : [],
            is_active: true,
        };
        if (editing) {
            await updateDoc(doc(db, 'teams', editing), data);
        } else {
            data.created_at = serverTimestamp();
            await addDoc(collection(db, 'teams'), data);
        }
        resetForm();
        loadTeams();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this team?')) return;
        await deleteDoc(doc(db, 'teams', id));
        loadTeams();
    };

    const handleResetLogins = async (id) => {
        if (!window.confirm('Clear all active logins for this team? This will force all currently logged-in devices to log out.')) return;
        try {
            await updateDoc(doc(db, 'teams', id), { active_devices: [] });
            alert('Logins cleared successfully.');
            loadTeams();
        } catch (e) {
            alert('Failed to clear logins: ' + e.message);
        }
    };

    const handleEdit = (t) => {
        setEditing(t.id);
        setForm({
            name: t.name || '',
            team_code: t.team_code || '',
            members: t.members ? JSON.stringify(t.members) : '',
        });
    };

    const toggleActive = async (id, current) => {
        await updateDoc(doc(db, 'teams', id), { is_active: !current });
        loadTeams();
    };

    const resetForm = () => {
        setEditing(null);
        setForm({ name: '', team_code: '', members: '' });
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,140,0,0.2)', borderRadius: '6px',
        color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', outline: 'none',
    };

    const deduplicateTeams = async () => {
        if (!window.confirm('This will scan all teams and delete duplicates (teams with the exact same Team Code). Continue?')) return;
        try {
            const snap = await getDocs(collection(db, 'teams'));
            const byCode = {};
            snap.docs.forEach(d => {
                const t = { id: d.id, ...d.data() };
                if (!byCode[t.team_code]) byCode[t.team_code] = [];
                byCode[t.team_code].push(t);
            });
            let deleted = 0;
            for (const code of Object.keys(byCode)) {
                const list = byCode[code];
                if (list.length > 1) {
                    list.sort((a, b) => new Date(b.created_at?.seconds * 1000 || 0) - new Date(a.created_at?.seconds * 1000 || 0));
                    for (let i = 1; i < list.length; i++) {
                        await deleteDoc(doc(db, 'teams', list[i].id));
                        deleted++;
                    }
                }
            }
            alert(`Deduplication complete! Deleted ${deleted} duplicate teams.`);
            loadTeams();
        } catch (e) {
            console.error(e);
            alert('Failed to deduplicate: ' + e.message);
        }
    };

    return (
        <div style={{ maxWidth: '900px' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '25px', textShadow: '0 0 8px rgba(255,140,0,0.3)' }}>
                TEAM MANAGEMENT
            </h2>

            <div style={{ background: 'rgba(20,8,0,0.3)', border: '1px solid rgba(255,140,0,0.15)', borderRadius: '8px', padding: '25px', marginBottom: '25px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>TEAM NAME</label>
                        <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>TEAM CODE</label>
                        <input style={inputStyle} value={form.team_code} onChange={(e) => setForm({ ...form, team_code: e.target.value.toUpperCase() })} />
                    </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>MEMBERS (JSON)</label>
                    <textarea style={{ ...inputStyle, minHeight: '60px' }} value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value })} placeholder='[{"name":"John","reg_no":"123"}]' />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSave} style={{
                        padding: '10px 24px', borderRadius: '6px', cursor: 'pointer',
                        background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.4)',
                        color: '#ff8c00', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em',
                    }}>{editing ? '✏️ UPDATE' : '➕ ADD TEAM'}</button>
                    {editing && <button onClick={resetForm} style={{
                        padding: '10px 24px', borderRadius: '6px', cursor: 'pointer',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.5)', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem',
                    }}>CANCEL</button>}
                    {!editing && <button onClick={deduplicateTeams} style={{
                        padding: '10px 24px', borderRadius: '6px', cursor: 'pointer',
                        background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.4)',
                        color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em',
                    }}>🧹 REMOVE DUPLICATE TEAMS</button>}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {teams.map((t) => (
                    <div key={t.id} style={{
                        background: 'rgba(0,10,20,0.4)', border: '1px solid rgba(255,140,0,0.1)',
                        borderRadius: '8px', padding: '15px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#fff' }}>{t.name}</div>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: '#0ff', marginTop: '2px' }}>
                                Code: {t.team_code}
                            </div>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                {Array.isArray(t.members) ? `${t.members.length} members` : '0 members'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => toggleActive(t.id, t.is_active)} style={{
                                padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.55rem',
                                fontFamily: "'Orbitron', sans-serif",
                                background: t.is_active ? 'rgba(0,255,100,0.08)' : 'rgba(255,50,50,0.08)',
                                border: `1px solid ${t.is_active ? 'rgba(0,255,100,0.3)' : 'rgba(255,50,50,0.3)'}`,
                                color: t.is_active ? '#4ade80' : '#ff6b6b',
                            }}>{t.is_active ? 'ACTIVE' : 'INACTIVE'}</button>
                            <button onClick={() => handleEdit(t)} style={{
                                padding: '5px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid rgba(255,140,0,0.3)',
                                color: '#ff8c00', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>EDIT</button>
                            <button onClick={() => handleResetLogins(t.id)} style={{
                                padding: '5px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid rgba(0,255,255,0.3)',
                                color: '#0ff', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>RESET LOGINS</button>
                            <button onClick={() => handleDelete(t.id)} style={{
                                padding: '5px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid rgba(255,50,50,0.3)',
                                color: '#ff6b6b', fontSize: '0.55rem', fontFamily: "'Orbitron', sans-serif",
                            }}>DEL</button>
                        </div>
                    </div>
                ))}
                {teams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Rajdhani', sans-serif" }}>
                        No teams yet. Add one above!
                    </div>
                )}
            </div>
        </div >
    );
}
