import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebaseClient';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

const S = { gold: '#ff8c00', card: 'rgba(15,10,5,0.85)', border: 'rgba(255,140,0,0.2)', text: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.5)' };

function parseExcelWithHeaders(rows) {
    if (rows.length < 2) return [];

    let headerIdx = -1;
    let headers = [];
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const row = rows[i].map(c => String(c || '').trim().toLowerCase());
        if (row.some(c => c.includes('team') || c.includes('member'))) {
            headerIdx = i;
            headers = row;
            break;
        }
    }

    if (headerIdx === -1) {
        return parseHorizontalNoHeader(rows);
    }

    const colMap = { members: {} };
    headers.forEach((h, i) => {
        if (/team\s*name/i.test(h) || (h === 'team' && !h.includes('member'))) {
            colMap.teamName = i;
        }
        if (/email/i.test(h)) colMap.email = i;

        if (!h.includes('reg')) {
            const memberMatch = h.match(/member\s*[-–]?\s*(\d)/i);
            if (memberMatch) {
                const num = memberMatch[1];
                if (!colMap.members[num]) colMap.members[num] = {};
                colMap.members[num].name = i;
            }
        }

        if (h.includes('reg')) {
            const regMatch = h.match(/member\s*[-–]?\s*(\d)/i) || h.match(/(\d)\s*[-–]?\s*reg/i);
            if (regMatch) {
                const num = regMatch[1];
                if (!colMap.members[num]) colMap.members[num] = {};
                colMap.members[num].regNo = i;
            }
        }
    });

    if (colMap.teamName === undefined) {
        headers.forEach((h, i) => {
            if (/name/i.test(h) && !h.includes('member')) colMap.teamName = i;
        });
    }

    const teams = [];
    for (let r = headerIdx + 1; r < rows.length; r++) {
        const cells = rows[r].map(c => (c === null || c === undefined) ? '' : String(c).trim());
        if (cells.every(c => !c)) continue;

        const teamName = colMap.teamName !== undefined ? cells[colMap.teamName] : '';
        if (!teamName) continue;

        const teamEmail = colMap.email !== undefined ? cells[colMap.email] : '';
        const members = [];

        Object.keys(colMap.members).sort().forEach(num => {
            const m = colMap.members[num];
            const name = m.name !== undefined ? cells[m.name] || '' : '';
            let regNo = m.regNo !== undefined ? cells[m.regNo] || '' : '';

            if (regNo && /E\+/i.test(regNo)) {
                try { regNo = BigInt(Math.round(parseFloat(regNo))).toString(); } catch { regNo = String(Math.round(parseFloat(regNo))); }
            }

            if (name) {
                members.push({
                    name,
                    reg_no: regNo,
                    role: members.length === 0 ? 'Leader' : 'Member',
                });
            }
        });

        if (members.length > 0) {
            const code = teamName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '-' + String(teams.length + 1).padStart(3, '0');
            teams.push({ name: teamName, team_code: code, email: teamEmail, members });
        }
    }

    if (teams.length === 0) {
        return parseHorizontalNoHeader(rows.slice(headerIdx + 1));
    }

    return teams;
}

function parseHorizontalNoHeader(rows) {
    const teams = [];
    for (const row of rows) {
        const cells = row.map(c => (c === null || c === undefined) ? '' : String(c).trim());
        if (cells.every(c => !c)) continue;

        let teamName = '';
        let teamEmail = '';
        const members = [];
        let startIdx = 0;

        for (let i = 0; i < Math.min(cells.length, 5); i++) {
            const val = cells[i];
            if (val.includes('@')) { teamEmail = val; continue; }
            if (/^\d{5,}/.test(val.replace(/\./g, '').replace(/E\+/g, '')) || /year/i.test(val)) continue;
            if (val && !teamName && !/^(CSE|IT|ECE|EEE|MECH|CIVIL|AIDS|AIML|CSD|CSM)/i.test(val)) {
                teamName = val;
                startIdx = i + 1;
                break;
            }
        }
        if (!teamName) continue;

        let currentMember = null;
        for (let i = startIdx; i < cells.length; i++) {
            const val = cells[i];
            if (!val) continue;

            const isRegNo = /^\d{8,}$/.test(val) || /E\+/i.test(val);
            const isSkip = /year/i.test(val) ||
                /^(CSE|IT|ECE|EEE|MECH|CIVIL|AIDS|AIML|CSD|CSM|EIE|BME)$/i.test(val) ||
                /^\d{10}$/.test(val) ||
                /^https?:\/\//i.test(val) || /\.(com|in|org|io)\b/i.test(val) ||
                /^(yes|no|na|n\/a|true|false|none|nil|T)$/i.test(val) ||
                /^\d+$/.test(val) || /^[A-Z0-9]{12,}$/.test(val);

            if (isRegNo) {
                let regStr = val;
                if (/E\+/i.test(val)) { try { regStr = BigInt(Math.round(parseFloat(val))).toString(); } catch { regStr = String(Math.round(parseFloat(val))); } }
                if (currentMember) currentMember.reg_no = regStr;
                continue;
            }
            if (isSkip) continue;

            const alphaOnly = val.replace(/[^a-zA-Z]/g, '');
            if (alphaOnly.length < 4 && val.split(/\s+/).length < 2) continue;

            if (currentMember && currentMember.name) members.push(currentMember);
            currentMember = { name: val, reg_no: '', role: members.length === 0 ? 'Leader' : 'Member' };
        }
        if (currentMember && currentMember.name) members.push(currentMember);

        if (members.length > 0) {
            const code = teamName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '-' + String(teams.length + 1).padStart(3, '0');
            teams.push({ name: teamName, team_code: code, email: teamEmail, members });
        }
    }
    return teams;
}

export default function AdminTeamUpload() {
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const fileRef = useRef();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = new Uint8Array(ev.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                const teams = parseExcelWithHeaders(rows);
                setPreview(teams);
                setResult(null);
            };
            reader.readAsArrayBuffer(file);
        } else {
            setResult({ success: 0, failed: 1, error: 'Unsupported file format. Please upload an Excel (.xlsx or .xls) file.' });
        }
    };

    const upload = async () => {
        if (!preview || !preview.length) return;
        setUploading(true);
        setResult(null);

        try {
            const batch = writeBatch(db);
            let count = 0;

            preview.forEach(team => {
                if (count >= 450) return; // safety limit
                const ref = doc(collection(db, 'teams'));
                batch.set(ref, {
                    name: team.name,
                    team_code: team.team_code,
                    members: team.members,
                    is_active: true,
                    created_at: serverTimestamp(),
                });
                count++;
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timed out after 15 seconds. Check network or database rules.')), 15000)
            );

            await Promise.race([batch.commit(), timeoutPromise]);

            setResult({ success: count, failed: preview.length - count, error: '' });
        } catch (e) {
            console.error('Upload failed:', e);
            setResult({ success: 0, failed: preview.length, error: e.message });
        }
        setUploading(false);
    };

    return (
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: S.gold, letterSpacing: '0.1em', marginBottom: '25px' }}>📤 UPLOAD TEAMS</h2>

            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', color: S.gold, letterSpacing: '0.08em', marginBottom: '12px' }}>SUPPORTED FORMATS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.7rem', color: S.gold, fontFamily: "'Orbitron', sans-serif", marginBottom: '6px' }}>📊 EXCEL (.xlsx / .xls)</div>
                        <p style={{ color: S.dim, fontSize: '0.85rem', margin: 0 }}>
                            Header row needs to contain variations of "Team name", "Team member - 1", "Team member 1 - Reg No" etc.<br />
                            Auto-detects columns from headers based on common naming conventions.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{ padding: '12px 25px', background: 'rgba(255,140,0,0.15)', border: `1px solid ${S.gold}`, borderRadius: '6px', color: S.gold, fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.08em' }}>
                    📁 SELECT FILE (.xlsx / .xls)
                </button>
                {preview && preview.length > 0 && (
                    <button onClick={upload} disabled={uploading} style={{ padding: '12px 25px', background: uploading ? 'rgba(100,100,100,0.2)' : 'rgba(74,222,128,0.15)', border: `1px solid ${uploading ? 'rgba(100,100,100,0.3)' : '#4ade80'}`, borderRadius: '6px', color: uploading ? S.dim : '#4ade80', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', cursor: uploading ? 'default' : 'pointer', letterSpacing: '0.08em' }}>
                        {uploading ? '⏳ UPLOADING...' : `✅ UPLOAD ${preview.length} TEAMS`}
                    </button>
                )}
            </div>

            {result && (
                <div style={{ padding: '15px 20px', background: result.failed > 0 ? 'rgba(255,50,50,0.08)' : 'rgba(74,222,128,0.08)', border: `1px solid ${result.failed > 0 ? 'rgba(255,50,50,0.3)' : 'rgba(74,222,128,0.3)'}`, borderRadius: '8px', marginBottom: '20px' }}>
                    <span style={{ color: result.failed > 0 ? '#ff6b6b' : '#4ade80', fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>
                        {result.success > 0 ? `✅ ${result.success} uploaded` : ''}{result.failed > 0 ? ` ❌ ${result.failed} failed` : ''}
                    </span>
                    {result.error && (
                        <div style={{ marginTop: '8px', color: '#ff6b6b', fontSize: '0.85rem', fontFamily: "'Rajdhani', sans-serif" }}>
                            Error: {result.error}
                        </div>
                    )}
                </div>
            )}

            {preview && (
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: S.gold, letterSpacing: '0.08em', marginBottom: '10px' }}>
                        PREVIEW — {preview.length} TEAMS DETECTED
                    </div>
                </div>
            )}
            {preview && preview.map((team, i) => (
                <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', marginBottom: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: S.gold }}>{team.name}</span>
                            <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: S.dim }}>{team.team_code}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: S.dim }}>{team.members.length} members</span>
                    </div>
                    {team.members.map((m, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', borderBottom: j < team.members.length - 1 ? '1px solid rgba(255,140,0,0.06)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.65rem', color: j === 0 ? S.gold : S.dim, fontFamily: "'Orbitron', sans-serif" }}>{j === 0 ? '👑' : '•'}</span>
                                <span style={{ color: S.text }}>{m.name}</span>
                            </div>
                            <span style={{ color: '#0ff', fontSize: '0.85rem', fontFamily: "'Orbitron', sans-serif" }}>{m.reg_no}</span>
                        </div>
                    ))}
                </div>
            ))}

            {preview && preview.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#ff6b6b' }}>
                    Could not parse any teams from the file. Check the format.
                </div>
            )}
        </div>
    );
}
