import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import * as XLSX from 'xlsx';
import { collection, getDocs, addDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { getEvalCriteria } from './AdminEvaluation';

export default function AdminReviews() {
    const [submissions, setSubmissions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [round, setRound] = useState(1);
    const [form, setForm] = useState({ submission_id: '', judge_name: '' });
    const [scores, setScores] = useState({});
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [pastComments, setPastComments] = useState([]);
    const [sortBy, setSortBy] = useState('recent');

    const metrics = getEvalCriteria(round);
    const totalMax = metrics.reduce((a, m) => a + m.max, 0);

    useEffect(() => { loadData(); }, [round]);

    useEffect(() => {
        if (form.submission_id) {
            loadPastComments(form.submission_id);
        } else {
            setPastComments([]);
        }
    }, [form.submission_id, round]);

    const loadPastComments = async (teamId) => {
        try {
            const q = query(collection(db, 'reviews'), where('team_id', '==', teamId));
            const snap = await getDocs(q);
            const past = snap.docs
                .map(d => d.data())
                .filter(r => r.round < round && r.comments && r.comments.trim() !== '')
                .sort((a, b) => (b.round || 0) - (a.round || 0));
            setPastComments(past);
        } catch {
            setPastComments([]);
        }
    };

    const handleExport = async () => {
        try {
            const snap = await getDocs(collection(db, 'reviews'));
            const allReviews = [];
            for (const d of snap.docs) {
                const r = { id: d.id, ...d.data() };
                try {
                    if (r.team_id) {
                        const teamSnap = await getDoc(doc(db, 'teams', r.team_id));
                        r.teamName = teamSnap.exists() ? teamSnap.data().name : 'Unknown';
                        r.teamCode = teamSnap.exists() ? teamSnap.data().team_code : 'N/A';
                    }
                } catch { }
                allReviews.push(r);
            }
            if (!allReviews.length) { setMessage('❌ No reviews to export.'); return; }

            const teamsMap = {};
            allReviews.forEach(r => {
                const teamName = r.teamName || 'Unknown';
                const teamCode = r.teamCode || 'N/A';
                if (!teamsMap[teamName]) {
                    teamsMap[teamName] = { Team: teamName, 'Team Code': teamCode, 'R1 Total': 0, 'R2 Total': 0, 'Combined Total': 0 };
                }
                const rnd = r.round;
                teamsMap[teamName][`R${rnd} Total`] = Math.max(teamsMap[teamName][`R${rnd} Total`], r.total_score || 0);
                if (r.comments) {
                    const ck = `R${rnd} Comments`;
                    teamsMap[teamName][ck] = teamsMap[teamName][ck] ? teamsMap[teamName][ck] + ' | ' + r.comments : r.comments;
                }
            });
            Object.values(teamsMap).forEach(t => { t['Combined Total'] = (t['R1 Total'] || 0) + (t['R2 Total'] || 0); });
            const combinedData = Object.values(teamsMap).sort((a, b) => b['Combined Total'] - a['Combined Total']);

            const currentRoundReviews = allReviews.filter(r => r.round === round)
                .sort((a, b) => sortBy === 'score' ? b.total_score - a.total_score : new Date(b.reviewed_at) - new Date(a.reviewed_at))
                .map(r => ({ Team: r.teamName, 'Team Code': r.teamCode, Judge: r.judge_name, 'Total Score': r.total_score, Comments: r.comments || '', ...(r.scores || {}) }));

            const detailedData = allReviews.map(r => ({
                Round: r.round, Team: r.teamName, 'Team Code': r.teamCode, Judge: r.judge_name,
                'Total Score': r.total_score, Comments: r.comments || '', ...(r.scores || {})
            })).sort((a, b) => a.Round - b.Round || b['Total Score'] - a['Total Score']);

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(combinedData), "Combined Scores");
            if (currentRoundReviews.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(currentRoundReviews), `R${round} Sorted (${sortBy})`);
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedData), "All Detailed Reviews");
            XLSX.writeFile(wb, `SCRS_Evaluations_R${round}_${sortBy}.xlsx`);
            setMessage('✅ Export successful!');
        } catch (e) {
            setMessage(`❌ Export failed: ${e.message}`);
        }
    };

    const loadData = async () => {
        try {
            const teamsSnap = await getDocs(query(collection(db, 'teams'), where('is_active', '==', true)));
            const teamsData = [];
            for (const d of teamsSnap.docs) {
                const t = { id: d.id, ...d.data() };
                const subQ = query(collection(db, 'submissions'), where('team_id', '==', d.id));
                const subSnap = await getDocs(subQ);
                t.submissions = subSnap.docs.map(s => ({ id: s.id, ...s.data() }));
                teamsData.push(t);
            }
            setSubmissions(teamsData);
        } catch { }

        try {
            const rQ = query(collection(db, 'reviews'), where('round', '==', round), orderBy('reviewed_at', 'desc'));
            const rSnap = await getDocs(rQ);
            const reviewsData = [];
            for (const d of rSnap.docs) {
                const r = { id: d.id, ...d.data() };
                if (r.team_id) {
                    try {
                        const teamSnap = await getDoc(doc(db, 'teams', r.team_id));
                        r.teamName = teamSnap.exists() ? teamSnap.data().name : 'Unknown';
                    } catch { r.teamName = 'Unknown'; }
                }
                reviewsData.push(r);
            }
            setReviews(reviewsData);
        } catch { setReviews([]); }
    };

    const resetForm = () => {
        setForm({ submission_id: '', judge_name: '' });
        setScores({});
        setComments('');
    };

    const handleSubmit = async () => {
        if (!form.submission_id || !form.judge_name) return;
        setSubmitting(true);
        setMessage('');

        const total = metrics.reduce((sum, m) => sum + (Number(scores[m.key]) || 0), 0);

        try {
            await addDoc(collection(db, 'reviews'), {
                team_id: form.submission_id,
                judge_name: form.judge_name,
                round,
                scores,
                comments,
                total_score: total,
                reviewed_at: new Date().toISOString(),
            });
            setMessage('✅ Review submitted!');
            resetForm();
            loadData();
        } catch (e) {
            setMessage(`❌ ${e.message}`);
        }
        setSubmitting(false);
    };

    const S = { gold: '#ff8c00', border: 'rgba(255,140,0,0.2)', dim: 'rgba(255,255,255,0.5)' };
    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${S.border}`, borderRadius: '6px',
        color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', outline: 'none',
    };
    const labelStyle = {
        fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem',
        color: 'rgba(255,140,0,0.6)', letterSpacing: '0.1em', marginBottom: '6px', display: 'block',
    };

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: S.gold, letterSpacing: '0.1em', margin: 0, textShadow: '0 0 8px rgba(255,140,0,0.3)' }}>
                    REVIEW MANAGEMENT
                </h2>
                <button onClick={handleExport} style={{
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                    background: 'rgba(0,255,255,0.1)', border: `1px solid rgba(0,255,255,0.3)`,
                    color: '#0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em',
                }}>
                    💾 EXPORT SCORES
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${S.border}` }}>
                {[1, 2].map(r => (
                    <button key={r} onClick={() => { setRound(r); resetForm(); }} style={{
                        flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em',
                        background: round === r ? 'rgba(255,140,0,0.15)' : 'rgba(0,0,0,0.3)',
                        color: round === r ? S.gold : 'rgba(255,255,255,0.3)',
                        transition: 'all 0.3s',
                    }}>
                        🏆 ROUND {r} {r === 1 ? '(PRELIMS)' : '(FINALS)'}
                    </button>
                ))}
            </div>

            <div style={{ background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.15)', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {metrics.map(m => (
                    <span key={m.key} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: S.dim }}>
                        <strong style={{ color: '#0ff' }}>{m.label}</strong> /{m.max}
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', color: S.gold }}>
                    TOTAL: /{totalMax}
                </span>
            </div>

            <div style={{ background: 'rgba(20,8,0,0.3)', border: `1px solid rgba(255,140,0,0.15)`, borderRadius: '8px', padding: '25px', marginBottom: '25px' }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', color: S.gold, letterSpacing: '0.1em', marginBottom: '20px' }}>
                    ADD REVIEW — ROUND {round}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={labelStyle}>SUBMISSION</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.submission_id} onChange={(e) => setForm({ ...form, submission_id: e.target.value })}>
                            <option value="">Select team...</option>
                            {submissions.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} {s.submissions && s.submissions.length > 0 && s.submissions[0].repo_link ? '(Repo)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>JUDGE NAME</label>
                        <input style={inputStyle} placeholder="Enter judge name..." value={form.judge_name} onChange={(e) => setForm({ ...form, judge_name: e.target.value })} />
                    </div>
                    {pastComments.length > 0 && (
                        <div style={{ gridColumn: '1 / -1', background: 'rgba(255,140,0,0.05)', padding: '12px 18px', borderRadius: '6px', border: `1px solid ${S.border}`, marginTop: '5px' }}>
                            <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: S.gold, margin: '0 0 10px 0', letterSpacing: '0.05em' }}>PAST ROUND COMMENTS (FOR THIS TEAM)</h4>
                            {pastComments.map((pc, i) => (
                                <div key={i} style={{ marginBottom: i < pastComments.length - 1 ? '10px' : 0, paddingBottom: i < pastComments.length - 1 ? '10px' : 0, borderBottom: i < pastComments.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                                    <div style={{ fontSize: '0.65rem', color: S.dim, fontFamily: "'Orbitron', sans-serif", marginBottom: '4px' }}>ROUND {pc.round} • JUDGE: {pc.judge_name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontStyle: 'italic' }}>"{pc.comments}"</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: '10px', marginBottom: '15px' }}>
                    {metrics.map((m) => (
                        <div key={m.key}>
                            <label style={{ ...labelStyle, fontSize: '0.5rem' }}>{m.label} ({m.max})</label>
                            <input type="number" min="0" max={m.max} style={inputStyle}
                                value={scores[m.key] || 0}
                                onChange={(e) => setScores({ ...scores, [m.key]: Math.min(Number(e.target.value), m.max) })} />
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>COMMENTS</label>
                    <textarea style={{ ...inputStyle, minHeight: '60px' }} value={comments} onChange={(e) => setComments(e.target.value)} />
                </div>

                {message && (
                    <div style={{
                        marginBottom: '15px', padding: '8px 14px', borderRadius: '6px', fontSize: '0.9rem', fontFamily: "'Rajdhani', sans-serif",
                        background: message.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(255,50,50,0.1)',
                        color: message.startsWith('✅') ? '#4ade80' : '#ff6b6b',
                        border: `1px solid ${message.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(255,50,50,0.3)'}`,
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={handleSubmit} disabled={submitting || !form.submission_id || !form.judge_name} style={{
                        padding: '8px 24px', borderRadius: '6px', cursor: 'pointer',
                        background: 'rgba(255,140,0,0.15)', border: `1px solid rgba(255,140,0,0.4)`,
                        color: S.gold, fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em',
                        opacity: submitting ? 0.5 : 1,
                    }}>
                        {submitting ? '⏳ SUBMITTING...' : 'SUBMIT REVIEW'}
                    </button>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: S.gold, fontWeight: 700 }}>
                        {metrics.reduce((sum, m) => sum + (Number(scores[m.key]) || 0), 0)} / {totalMax}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', color: S.gold, letterSpacing: '0.1em', margin: 0 }}>
                    ROUND {round} REVIEWS ({reviews.length})
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select style={{ ...inputStyle, padding: '4px 8px', width: 'auto', fontSize: '0.75rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="recent">Sort by: Recent</option>
                        <option value="score">Sort by: Score (High to Low)</option>
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reviews.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: S.dim }}>No reviews yet for Round {round}.</div>
                )}
                {[...reviews].sort((a, b) => {
                    if (sortBy === 'score') return b.total_score - a.total_score;
                    return new Date(b.reviewed_at) - new Date(a.reviewed_at);
                }).map((r) => (
                    <div key={r.id} style={{ background: 'rgba(0,10,20,0.4)', border: '1px solid rgba(255,140,0,0.1)', borderRadius: '8px', padding: '15px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
                                {r.teamName || 'Unknown Team'} — <span style={{ color: S.dim }}>Judge: {r.judge_name}</span>
                            </div>
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem', color: S.gold, fontWeight: 700 }}>
                                {r.total_score}/{totalMax}
                            </div>
                        </div>
                        {r.scores && (
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: r.comments ? '8px' : 0 }}>
                                {metrics.map(m => (
                                    <span key={m.key} style={{ fontSize: '0.8rem', color: S.dim, fontFamily: "'Rajdhani', sans-serif" }}>
                                        {m.label}: <strong style={{ color: '#0ff' }}>{r.scores[m.key] || 0}</strong>/{m.max}
                                    </span>
                                ))}
                            </div>
                        )}
                        {r.comments && (
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: S.dim }}>{r.comments}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
