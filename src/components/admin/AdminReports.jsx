import { useState } from 'react';
import { db } from '../../lib/firebaseClient';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function AdminReports() {
    const [loading, setLoading] = useState('');

    const downloadExcel = (data, filename) => {
        if (!data.length) return alert('No data to export');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, filename);
    };

    const exportTeams = async () => {
        setLoading('teams');
        try {
            const q = query(collection(db, 'teams'), orderBy('name'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (data.length) downloadExcel(data.map(t => ({ ...t, members: JSON.stringify(t.members) })), 'teams_list.xlsx');
        } catch (error) {
            alert('Failed to export teams: ' + error.message);
        } finally {
            setLoading('');
        }
    };

    const exportSelections = async () => {
        setLoading('selections');
        try {
            const snap = await getDocs(collection(db, 'selections'));
            const flat = [];
            for (const d of snap.docs) {
                const s = d.data();
                let teamName = '', problemTitle = '';
                try {
                    if (s.team_id) { const t = await getDoc(doc(db, 'teams', s.team_id)); teamName = t.exists() ? t.data().name : ''; }
                    if (s.problem_id) { const p = await getDoc(doc(db, 'problems', s.problem_id)); problemTitle = p.exists() ? p.data().title : ''; }
                } catch { }
                flat.push({ team: teamName, problem: problemTitle, selected_at: s.selected_at, is_locked: !!s.locked_at });
            }
            downloadExcel(flat, 'problem_selections.xlsx');
        } catch (error) {
            alert('Failed to export selections: ' + error.message);
        } finally {
            setLoading('');
        }
    };

    const exportSubmissions = async () => {
        setLoading('submissions');
        try {
            const snap = await getDocs(collection(db, 'submissions'));
            const flat = [];
            for (const d of snap.docs) {
                const s = d.data();
                let teamName = '';
                try { if (s.team_id) { const t = await getDoc(doc(db, 'teams', s.team_id)); teamName = t.exists() ? t.data().name : ''; } } catch { }
                flat.push({ team: teamName, repo_link: s.repo_link, status: s.status, submitted_at: s.submitted_at, notes: s.notes });
            }
            downloadExcel(flat, 'submissions.xlsx');
        } catch (error) {
            alert('Failed to export submissions: ' + error.message);
        } finally {
            setLoading('');
        }
    };

    const exportScores = async () => {
        setLoading('scores');
        try {
            const snap = await getDocs(collection(db, 'reviews'));
            const flat = [];
            for (const d of snap.docs) {
                const r = d.data();
                let teamName = '';
                try { if (r.team_id) { const t = await getDoc(doc(db, 'teams', r.team_id)); teamName = t.exists() ? t.data().name : ''; } } catch { }
                flat.push({ team: teamName, judge: r.reviewer_name, total_score: r.total_score, ...r.scores, comments: r.comments });
            }
            downloadExcel(flat, 'scores_summary.xlsx');
        } catch (error) {
            alert('Failed to export scores: ' + error.message);
        } finally {
            setLoading('');
        }
    };

    const btnStyle = (color) => ({
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '18px 25px', borderRadius: '8px', cursor: 'pointer',
        background: `rgba(${color},0.08)`, border: `1px solid rgba(${color},0.25)`,
        color: '#fff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem',
        letterSpacing: '0.08em', textAlign: 'left', width: '100%',
        transition: 'all 0.2s ease',
    });

    return (
        <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '25px', textShadow: '0 0 8px rgba(255,140,0,0.3)' }}>
                REPORTS & EXPORTS
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={exportTeams} disabled={!!loading} style={btnStyle('0,255,255')}>
                    <span style={{ fontSize: '1.3rem' }}>📋</span>
                    <div>
                        <div style={{ color: '#0ff', marginBottom: '3px' }}>Teams List</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            {loading === 'teams' ? 'Exporting...' : 'All registered teams with member details'}
                        </div>
                    </div>
                </button>

                <button onClick={exportSelections} disabled={!!loading} style={btnStyle('0,255,100')}>
                    <span style={{ fontSize: '1.3rem' }}>🎯</span>
                    <div>
                        <div style={{ color: '#4ade80', marginBottom: '3px' }}>Problem Selections</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            {loading === 'selections' ? 'Exporting...' : 'Team → problem mapping with timestamps'}
                        </div>
                    </div>
                </button>

                <button onClick={exportSubmissions} disabled={!!loading} style={btnStyle('255,180,0')}>
                    <span style={{ fontSize: '1.3rem' }}>📦</span>
                    <div>
                        <div style={{ color: '#fbbf24', marginBottom: '3px' }}>Submissions Status</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            {loading === 'submissions' ? 'Exporting...' : 'All submissions with validation status'}
                        </div>
                    </div>
                </button>

                <button onClick={exportScores} disabled={!!loading} style={btnStyle('255,140,0')}>
                    <span style={{ fontSize: '1.3rem' }}>⭐</span>
                    <div>
                        <div style={{ color: '#ff8c00', marginBottom: '3px' }}>Scores Summary</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            {loading === 'scores' ? 'Exporting...' : 'Judge scores, totals, and comments'}
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
