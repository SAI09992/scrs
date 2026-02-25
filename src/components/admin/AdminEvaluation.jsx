import { useState, useEffect } from 'react';

const STORAGE_KEY = 'devfest_eval_criteria';

const DEFAULT_CRITERIA = {
    1: [],
    2: [],
};

export function getEvalCriteria(round) {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed[round] || [];
        }
    } catch { }
    return DEFAULT_CRITERIA[round] || [];
}

function saveAllCriteria(allCriteria) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCriteria));
}

function getAllCriteria() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch { }
    return { ...DEFAULT_CRITERIA };
}

const S = { gold: '#ff8c00', card: 'rgba(15,10,5,0.85)', border: 'rgba(255,140,0,0.2)', text: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.5)' };

export default function AdminEvaluation() {
    const [round, setRound] = useState(1);
    const [criteria, setCriteria] = useState([]);
    const [form, setForm] = useState({ label: '', max: 10 });
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        setCriteria(getEvalCriteria(round));
    }, [round]);

    const save = () => {
        if (!form.label) return;
        const all = getAllCriteria();
        const list = [...(all[round] || [])];

        if (editing !== null) {
            list[editing] = { key: form.label.toLowerCase().replace(/\s+/g, '_'), label: form.label, max: parseInt(form.max) };
        } else {
            list.push({ key: form.label.toLowerCase().replace(/\s+/g, '_'), label: form.label, max: parseInt(form.max) });
        }
        all[round] = list;
        saveAllCriteria(all);
        setCriteria(list);
        setForm({ label: '', max: 10 });
        setEditing(null);
    };

    const remove = (idx) => {
        const all = getAllCriteria();
        const list = [...(all[round] || [])];
        list.splice(idx, 1);
        all[round] = list;
        saveAllCriteria(all);
        setCriteria(list);
    };

    const totalMarks = criteria.reduce((s, c) => s + c.max, 0);
    const inputStyle = { padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: '6px', color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem' };

    return (
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: S.gold, letterSpacing: '0.1em', marginBottom: '25px' }}>⚖️ EVALUATION CRITERIA</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[1, 2].map(r => (
                    <button key={r} onClick={() => setRound(r)} style={{
                        padding: '10px 25px', borderRadius: '6px', cursor: 'pointer',
                        background: round === r ? 'rgba(255,140,0,0.2)' : 'transparent',
                        border: `1px solid ${round === r ? S.gold : S.border}`,
                        color: round === r ? S.gold : S.dim,
                        fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em',
                    }}>
                        ROUND {r}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', padding: '10px 20px', background: S.card, border: `1px solid ${S.border}`, borderRadius: '6px' }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: S.dim, letterSpacing: '0.08em' }}>TOTAL: </span>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', color: S.gold }}>{totalMarks}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>CRITERIA NAME</label>
                    <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Innovation" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ width: '100px' }}>
                    <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>MAX MARKS</label>
                    <input type="number" value={form.max} onChange={e => setForm({ ...form, max: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <button onClick={save} style={{ padding: '10px 20px', background: 'rgba(255,140,0,0.15)', border: `1px solid ${S.gold}`, borderRadius: '6px', color: S.gold, fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {editing !== null ? '✏️ UPDATE' : '➕ ADD'}
                </button>
            </div>

            {criteria.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 18px', background: S.card, border: `1px solid ${S.border}`, borderRadius: '8px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, minWidth: '25px' }}>{i + 1}.</span>
                    <span style={{ flex: 1, color: S.text, fontSize: '1rem' }}>{c.label}</span>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', color: S.gold, minWidth: '60px', textAlign: 'right' }}>{c.max} pts</span>
                    <button onClick={() => { setEditing(i); setForm({ label: c.label, max: c.max }); }} style={{ background: 'none', border: 'none', color: S.gold, cursor: 'pointer', fontSize: '1rem' }}>✏️</button>
                    <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                </div>
            ))}
            {criteria.length === 0 && <p style={{ color: S.dim, textAlign: 'center', padding: '30px' }}>No criteria for Round {round} yet. Add some above!</p>}
        </div>
    );
}
