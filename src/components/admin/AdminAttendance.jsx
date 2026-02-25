import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebaseClient';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';

const S = { gold: '#ff8c00', card: 'rgba(15,10,5,0.85)', border: 'rgba(255,140,0,0.2)', text: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.5)' };

function parseMembers(team) {
    const m = typeof team.members === 'string' ? JSON.parse(team.members) : (team.members || []);
    return m;
}

export default function AdminAttendance() {
    const [teams, setTeams] = useState([]);
    const [round, setRound] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showDownload, setShowDownload] = useState(false);
    const [dlRounds, setDlRounds] = useState([1, 2, 3]);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadRound, setUploadRound] = useState(1);
    const [uploadMsg, setUploadMsg] = useState('');
    const fileRef = useRef(null);

    useEffect(() => { loadTeams(); }, []);

    const loadTeams = async () => {
        const q = query(collection(db, 'teams'), orderBy('name'));
        const snap = await getDocs(q);
        setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    };

    const rKey = (r) => `r${r}`;
    const isPresent = (member, r = round) => !!member[rKey(r)];

    const saveMembers = async (teamId, members) => {
        await updateDoc(doc(db, 'teams', teamId), { members });
    };

    const toggleMember = async (team, memberIdx) => {
        const members = [...parseMembers(team)];
        const key = rKey(round);
        members[memberIdx] = { ...members[memberIdx], [key]: !members[memberIdx][key] };
        setTeams(prev => prev.map(t => t.id === team.id ? { ...t, members } : t));
        await saveMembers(team.id, members);
    };

    const toggleTeam = async (team) => {
        const members = [...parseMembers(team)];
        const key = rKey(round);
        const allPresent = members.every(m => !!m[key]);
        const updated = members.map(m => ({ ...m, [key]: !allPresent }));
        setTeams(prev => prev.map(t => t.id === team.id ? { ...t, members: updated } : t));
        await saveMembers(team.id, updated);
    };

    const downloadExcel = () => {
        const rows = [];
        teams.forEach(t => {
            const members = parseMembers(t);
            members.forEach(m => {
                const row = { 'Team': t.name, 'Member': m.name, 'Reg No': m.reg_no || '' };
                dlRounds.sort().forEach(r => {
                    row[`Round ${r}`] = isPresent(m, r) ? 'Present' : 'Absent';
                });
                rows.push(row);
            });
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const cols = [{ wch: 20 }, { wch: 30 }, { wch: 15 }];
        dlRounds.forEach(() => cols.push({ wch: 10 }));
        ws['!cols'] = cols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, `attendance_round_${dlRounds.join('_')}.xlsx`);
        setShowDownload(false);
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadMsg('⏳ Processing...');

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws);
                const key = rKey(uploadRound);

                const teamMap = {};
                for (const row of rows) {
                    const teamName = (row['Team'] || row['team'] || '').trim();
                    const memberName = (row['Member'] || row['member'] || '').trim();
                    const status = row[`Round ${uploadRound}`] || row['Status'] || row['status'] || '';
                    const present = status.toLowerCase() === 'present';
                    if (!teamName || !memberName) continue;
                    if (!teamMap[teamName]) teamMap[teamName] = {};
                    teamMap[teamName][memberName] = present;
                }

                let count = 0;
                for (const t of teams) {
                    const updates = teamMap[t.name];
                    if (!updates) continue;
                    const members = parseMembers(t).map(m => {
                        if (updates[m.name] !== undefined) return { ...m, [key]: updates[m.name] };
                        return m;
                    });
                    await saveMembers(t.id, members);
                    count++;
                }

                setUploadMsg(`✅ Updated ${count} teams for Round ${uploadRound}`);
                loadTeams();
            } catch (err) {
                setUploadMsg(`❌ Error: ${err.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
        if (fileRef.current) fileRef.current.value = '';
    };

    const toggleDlRound = (r) => {
        setDlRounds(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    };

    const Toggle = ({ checked, onChange }) => (
        <div onClick={onChange} style={{ width: '42px', height: '22px', borderRadius: '11px', background: checked ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${checked ? '#4ade80' : 'rgba(255,255,255,0.2)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: checked ? '#4ade80' : 'rgba(255,255,255,0.4)', position: 'absolute', top: '2px', left: checked ? '22px' : '2px', transition: 'all 0.2s' }} />
        </div>
    );

    const btnStyle = (bg, bc, c) => ({ padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', background: bg, border: `1px solid ${bc}`, color: c, fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', letterSpacing: '0.08em' });

    return (
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: S.gold, letterSpacing: '0.1em', margin: 0 }}>📋 ATTENDANCE</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[1, 2, 3].map(r => (
                        <button key={r} onClick={() => setRound(r)} style={{
                            ...btnStyle(round === r ? 'rgba(255,140,0,0.2)' : 'transparent', round === r ? S.gold : S.border, round === r ? S.gold : S.dim),
                        }}>
                            ROUND {r}
                        </button>
                    ))}
                    <button onClick={() => { setShowDownload(!showDownload); setShowUpload(false); }} style={btnStyle('rgba(0,255,255,0.08)', 'rgba(0,255,255,0.25)', '#0ff')}>
                        📥 EXCEL
                    </button>
                    <button onClick={() => { setShowUpload(!showUpload); setShowDownload(false); }} style={btnStyle('rgba(74,222,128,0.08)', 'rgba(74,222,128,0.25)', '#4ade80')}>
                        📤 UPLOAD
                    </button>
                </div>
            </div>

            {showDownload && (
                <div style={{ background: S.card, border: '1px solid rgba(0,255,255,0.2)', borderRadius: '10px', padding: '18px', marginBottom: '15px' }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: '#0ff', marginBottom: '12px' }}>SELECT ROUNDS TO DOWNLOAD</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {[1, 2, 3].map(r => (
                            <label key={r} style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', color: dlRounds.includes(r) ? '#0ff' : S.dim, fontSize: '0.9rem' }}>
                                <input type="checkbox" checked={dlRounds.includes(r)} onChange={() => toggleDlRound(r)} />
                                Round {r}
                            </label>
                        ))}
                        <button onClick={downloadExcel} disabled={!dlRounds.length} style={{ ...btnStyle('rgba(0,255,255,0.15)', '#0ff', '#0ff'), opacity: dlRounds.length ? 1 : 0.4 }}>
                            📥 DOWNLOAD
                        </button>
                    </div>
                </div>
            )}

            {showUpload && (
                <div style={{ background: S.card, border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '18px', marginBottom: '15px' }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: '#4ade80', marginBottom: '12px' }}>UPLOAD ATTENDANCE FROM EXCEL</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", display: 'block', marginBottom: '4px' }}>ROUND</label>
                            <select value={uploadRound} onChange={e => setUploadRound(Number(e.target.value))} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${S.border}`, borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}>
                                {[1, 2, 3].map(r => <option key={r} value={r}>Round {r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", display: 'block', marginBottom: '4px' }}>FILE</label>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleUpload} style={{ fontSize: '0.85rem', color: '#fff' }} />
                        </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: S.dim }}>
                        Excel columns: <strong style={{ color: '#0ff' }}>Team</strong>, <strong style={{ color: '#0ff' }}>Member</strong>, <strong style={{ color: '#0ff' }}>Round {uploadRound}</strong> (Present/Absent)
                    </div>
                    {uploadMsg && <div style={{ marginTop: '10px', fontSize: '0.9rem', color: uploadMsg.startsWith('✅') ? '#4ade80' : uploadMsg.startsWith('❌') ? '#ff6b6b' : S.dim }}>{uploadMsg}</div>}
                </div>
            )}

            {loading ? <p style={{ color: S.dim }}>Loading...</p> : teams.map(team => {
                const members = parseMembers(team);
                if (!members.length) return null;
                const allPresent = members.every(m => isPresent(m));

                return (
                    <div key={team.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${S.border}` }}>
                            <div>
                                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: S.gold, letterSpacing: '0.08em' }}>{team.name}</span>
                                <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: S.dim }}>{team.team_code}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif" }}>ALL</span>
                                <Toggle checked={allPresent} onChange={() => toggleTeam(team)} />
                            </div>
                        </div>
                        {members.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < members.length - 1 ? '1px solid rgba(255,140,0,0.06)' : 'none' }}>
                                <div>
                                    <span style={{ color: S.text }}>{m.name}</span>
                                    {m.reg_no && <span style={{ marginLeft: '10px', color: S.dim, fontSize: '0.8rem', fontFamily: "'Orbitron', sans-serif" }}>{m.reg_no}</span>}
                                </div>
                                <Toggle checked={isPresent(m)} onChange={() => toggleMember(team, i)} />
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
