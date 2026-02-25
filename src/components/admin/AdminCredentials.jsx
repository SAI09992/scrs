import { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebaseClient';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import * as XLSX from 'xlsx';

const S = { gold: '#ff8c00', card: 'rgba(15,10,5,0.85)', border: 'rgba(255,140,0,0.2)', text: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.5)' };

function generatePassword(len = 8) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
}

export default function AdminCredentials() {
    const [teams, setTeams] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [domain, setDomain] = useState('devfest.com');
    const [passwordLength, setPasswordLength] = useState(8);
    const [useTeamCodeAsPassword, setUseTeamCodeAsPassword] = useState(true);

    useEffect(() => {
        const loadTeams = async () => {
            const q = query(collection(db, 'teams'), orderBy('name'));
            const snap = await getDocs(q);
            setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        loadTeams();
    }, []);

    const generateForAll = () => {
        setGenerating(true);
        const newCreds = teams.map(team => ({
            team_id: team.id,
            team_name: team.name,
            team_code: team.team_code,
            email: `${team.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@${domain}`,
            password: useTeamCodeAsPassword ? team.team_code : generatePassword(passwordLength),
        }));
        setCredentials(newCreds);
        setGenerating(false);
    };

    const generateForOne = (team) => {
        const newCred = {
            team_id: team.id,
            team_name: team.name,
            team_code: team.team_code,
            email: `${team.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@${domain}`,
            password: useTeamCodeAsPassword ? team.team_code : generatePassword(passwordLength),
        };
        setCredentials(prev => {
            const filtered = prev.filter(c => c.team_id !== team.id);
            return [newCred, ...filtered];
        });
    };

    const downloadExcel = () => {
        if (!credentials.length) return;
        const data = credentials.map(c => ({
            'Team Name': c.team_name,
            'Team Code': c.team_code,
            'Email': c.email,
            'Password': c.password
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Credentials');
        XLSX.writeFile(workbook, 'team_credentials.xlsx');
    };

    const inputStyle = { padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: '6px', color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem' };
    const btnStyle = (bg, borderColor, textColor) => ({
        padding: '10px 25px', background: bg, border: `1px solid ${borderColor}`,
        borderRadius: '6px', color: textColor, fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem',
        cursor: 'pointer', letterSpacing: '0.08em',
    });

    return (
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: S.gold, letterSpacing: '0.1em', marginBottom: '25px' }}>🔑 TEAM CREDENTIALS</h2>

            <div style={{ background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.15)', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: '#0ff' }}>
                    ℹ️ With Firebase, teams log in using <strong>team codes</strong> directly — no email/password accounts needed. Use this page to generate credentials for reference or export only.
                </div>
            </div>

            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>EMAIL DOMAIN</label>
                        <input value={domain} onChange={e => setDomain(e.target.value)} style={{ ...inputStyle, width: '180px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>PASSWORD</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', gap: '5px', alignItems: 'center', color: S.dim, fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={useTeamCodeAsPassword} onChange={e => setUseTeamCodeAsPassword(e.target.checked)} />
                                Use Team Code
                            </label>
                            {!useTeamCodeAsPassword && (
                                <input type="number" min={6} max={16} value={passwordLength} onChange={e => setPasswordLength(parseInt(e.target.value))} style={{ ...inputStyle, width: '60px' }} />
                            )}
                        </div>
                    </div>
                    <button onClick={generateForAll} disabled={generating || !teams.length} style={{ ...btnStyle('rgba(255,140,0,0.15)', S.gold, S.gold), opacity: generating ? 0.5 : 1 }}>
                        {generating ? '⏳...' : `🔑 GENERATE FOR ALL ${teams.length} TEAMS`}
                    </button>
                </div>
            </div>

            {credentials.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <button onClick={downloadExcel} style={btnStyle('rgba(74,222,128,0.12)', 'rgba(74,222,128,0.4)', '#4ade80')}>
                        📥 EXCEL
                    </button>
                </div>
            )}

            {credentials.length > 0 && (
                <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, letterSpacing: '0.08em' }}>TEAM</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, letterSpacing: '0.08em' }}>TEAM CODE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, letterSpacing: '0.08em' }}>EMAIL</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, letterSpacing: '0.08em' }}>PASSWORD</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: S.gold, letterSpacing: '0.08em' }}>🔄</th>
                            </tr>
                        </thead>
                        <tbody>
                            {credentials.map((c, i) => (
                                <tr key={c.team_id || i} style={{ borderBottom: i < credentials.length - 1 ? `1px solid rgba(255,140,0,0.06)` : 'none' }}>
                                    <td style={{ padding: '10px 16px', color: S.text }}>{c.team_name}</td>
                                    <td style={{ padding: '10px 16px', color: '#4ade80', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}>{c.team_code}</td>
                                    <td style={{ padding: '10px 16px', color: '#0ff', fontSize: '0.9rem' }}>{c.email}</td>
                                    <td style={{ padding: '10px 16px', color: '#4ade80', fontFamily: "'Courier New', monospace", fontSize: '0.9rem' }}>{c.password}</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                        <button onClick={() => { const t = teams.find(t => t.id === c.team_id); if (t) generateForOne(t); }} style={{ background: 'none', border: 'none', color: S.gold, cursor: 'pointer', fontSize: '1rem' }}>🔄</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {credentials.length === 0 && teams.length > 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: S.dim }}>
                    Click "Generate for All Teams" to create login credentials.
                </div>
            )}
            {teams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: S.dim }}>
                    No teams found. Upload teams first.
                </div>
            )}
        </div>
    );
}
