import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';

export default function AdminProblems() {
    const [problems, setProblems] = useState([]);
    const [selections, setSelections] = useState([]);
    const [editing, setEditing] = useState(null);
    const [selConfig, setSelConfig] = useState({ is_open: false });
    const [form, setForm] = useState({
        title: '', description: '', team_limit: 3,
        requirements: '', deliverables: '', evaluation_focus: '', resources: '', is_visible: false,
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const probQ = query(collection(db, 'problems'), orderBy('created_at', 'desc'));
        const probSnap = await getDocs(probQ);
        setProblems(probSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        try {
            const cfgSnap = await getDoc(doc(db, 'selection_config', 'global'));
            if (cfgSnap.exists()) setSelConfig({ id: cfgSnap.id, ...cfgSnap.data() });
        } catch { }

        const selSnap = await getDocs(collection(db, 'selections'));
        setSelections(selSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const getSelectionCount = (problemId) => selections.filter(s => s.problem_id === problemId).length;

    const handleSave = async () => {
        if (!form.title) return;
        const saveData = {
            title: form.title, description: form.description,
            category: String(form.team_limit || 3),
            difficulty: 'medium',
            requirements: form.requirements, deliverables: form.deliverables,
            evaluation_focus: form.evaluation_focus, resources: form.resources,
            is_visible: form.is_visible,
        };
        if (editing) {
            await updateDoc(doc(db, 'problems', editing), saveData);
        } else {
            saveData.created_at = serverTimestamp();
            await addDoc(collection(db, 'problems'), saveData);
        }
        setForm({ title: '', description: '', team_limit: 3, requirements: '', deliverables: '', evaluation_focus: '', resources: '', is_visible: false });
        setEditing(null);
        loadData();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this problem?')) {
            await deleteDoc(doc(db, 'problems', id));
            loadData();
        }
    };

    const handleEdit = (p) => {
        setEditing(p.id);
        setForm({
            title: p.title, description: p.description || '',
            team_limit: parseInt(p.category) || 3,
            requirements: p.requirements || '', deliverables: p.deliverables || '',
            evaluation_focus: p.evaluation_focus || '', resources: p.resources || '',
            is_visible: p.is_visible,
        });
    };

    const toggleVisibility = async (id, current) => {
        await updateDoc(doc(db, 'problems', id), { is_visible: !current });
        loadData();
    };

    const toggleSelectionWindow = async () => {
        await setDoc(doc(db, 'selection_config', 'global'), { is_open: !selConfig.is_open }, { merge: true });
        loadData();
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,140,0,0.2)', borderRadius: '6px',
        color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', outline: 'none',
    };

    const labelStyle = {
        fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem',
        color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block',
    };

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#ff8c00',
                    letterSpacing: '0.1em', textShadow: '0 0 8px rgba(255,140,0,0.3)',
                }}>
                    PROBLEM MANAGEMENT
                </h2>
                <button onClick={toggleSelectionWindow} style={{
                    padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
                    background: selConfig.is_open ? 'rgba(255,50,50,0.15)' : 'rgba(0,255,100,0.15)',
                    border: `1px solid ${selConfig.is_open ? 'rgba(255,50,50,0.4)' : 'rgba(0,255,100,0.4)'}`,
                    color: selConfig.is_open ? '#ff6b6b' : '#4ade80',
                    fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', letterSpacing: '0.08em',
                }}>
                    {selConfig.is_open ? 'CLOSE SELECTION' : 'OPEN SELECTION'}
                </button>
            </div>

            <div style={{
                background: 'rgba(20,8,0,0.3)', border: '1px solid rgba(255,140,0,0.15)',
                borderRadius: '8px', padding: '25px', marginBottom: '25px',
            }}>
                <h3 style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem',
                    color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '20px',
                }}>
                    {editing ? 'EDIT PROBLEM' : 'ADD PROBLEM'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={labelStyle}>TITLE</label>
                        <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div style={{ width: '120px' }}>
                        <label style={labelStyle}>TEAM LIMIT</label>
                        <input type="number" min="1" style={inputStyle} value={form.team_limit} onChange={(e) => setForm({ ...form, team_limit: parseInt(e.target.value) || 1 })} />
                    </div>
                </div>
                {['description', 'requirements', 'deliverables', 'evaluation_focus', 'resources'].map((field) => (
                    <div key={field} style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>{field.replace('_', ' ').toUpperCase()}</label>
                        <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                    </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} />
                        VISIBLE TO TEAMS
                    </label>
                    <div style={{ flex: 1 }} />
                    {editing && (
                        <button onClick={() => { setEditing(null); setForm({ title: '', description: '', team_limit: 3, requirements: '', deliverables: '', evaluation_focus: '', resources: '', is_visible: false }); }} style={{
                            padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.5)', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem',
                        }}>
                            CANCEL
                        </button>
                    )}
                    <button onClick={handleSave} style={{
                        padding: '8px 24px', borderRadius: '6px', cursor: 'pointer',
                        background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.4)',
                        color: '#ff8c00', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em',
                    }}>
                        {editing ? 'UPDATE' : 'ADD PROBLEM'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {problems.map((p) => {
                    const limit = parseInt(p.category) || 999;
                    const count = getSelectionCount(p.id);
                    const isFull = count >= limit;

                    return (
                        <div key={p.id} style={{
                            background: 'rgba(0,10,20,0.4)', border: `1px solid ${isFull ? 'rgba(255,50,50,0.2)' : 'rgba(255,140,0,0.1)'}`,
                            borderRadius: '8px', padding: '15px 20px',
                            display: 'flex', alignItems: 'center', gap: '15px',
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#fff', letterSpacing: '0.05em' }}>
                                    {p.title}
                                </div>
                                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ color: isFull ? '#ff6b6b' : '#4ade80' }}>
                                        {count}/{limit} teams
                                    </span>
                                    <span>·</span>
                                    <span>{p.is_visible ? '👁 Visible' : '🚫 Hidden'}</span>
                                    {isFull && <span style={{ color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif", fontSize: '0.55rem', letterSpacing: '0.1em' }}>FULL</span>}
                                </div>
                            </div>
                            <button onClick={() => toggleVisibility(p.id, p.is_visible)} style={{
                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontFamily: "'Orbitron', sans-serif",
                            }}>
                                {p.is_visible ? 'HIDE' : 'SHOW'}
                            </button>
                            <button onClick={() => handleEdit(p)} style={{
                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.25)',
                                color: '#0ff', fontSize: '0.6rem', fontFamily: "'Orbitron', sans-serif",
                            }}>
                                EDIT
                            </button>
                            <button onClick={() => handleDelete(p.id)} style={{
                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
                                color: '#ff6b6b', fontSize: '0.6rem', fontFamily: "'Orbitron', sans-serif",
                            }}>
                                DELETE
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
