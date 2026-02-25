import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';

export default function ProblemSelection() {
    const { profile } = useAuth();
    const [problems, setProblems] = useState([]);
    const [selections, setSelections] = useState([]);
    const [mySelection, setMySelection] = useState(null);
    const [selConfig, setSelConfig] = useState({ is_open: false });
    const [search, setSearch] = useState('');
    const [confirmId, setConfirmId] = useState(null);
    const [viewingProblem, setViewingProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    const filtered = problems.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const probSnap = await getDocs(query(collection(db, 'problems'), where('is_visible', '==', true)));
            setProblems(probSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch { }

        try {
            const selSnap = await getDocs(collection(db, 'selections'));
            const sels = selSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSelections(sels);
            const mine = sels.find(s => s.team_id === profile?.team_id);
            setMySelection(mine || null);
        } catch { }

        try {
            const cfgSnap = await getDoc(doc(db, 'selection_config', 'global'));
            if (cfgSnap.exists()) setSelConfig(cfgSnap.data());
        } catch { }

        setLoading(false);
    };

    const getCount = (problemId) => {
        const uniqueTeams = new Set(selections.filter(s => s.problem_id === problemId).map(s => s.team_id));
        return uniqueTeams.size;
    };

    const selectProblem = async (problemId) => {
        if (!selConfig.is_open || mySelection) return;
        try {
            await addDoc(collection(db, 'selections'), {
                team_id: profile.team_id,
                problem_id: problemId,
                selected_at: new Date().toISOString(),
            });
            setViewingProblem(null);
            setConfirmId(null);
            loadData();
        } catch (e) {
            alert('Failed to select: ' + e.message);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '25px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent', borderTopColor: '#0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: '8px', border: '3px solid transparent', borderTopColor: 'rgba(212,168,83,0.8)', borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#0ff', boxShadow: '0 0 15px rgba(0,255,255,0.6)' }} />
                </div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', color: '#0ff', letterSpacing: '0.3em' }}>LOADING BOUNTY MISSIONS...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (mySelection && !viewingProblem) {
        const p = problems.find(prob => prob.id === mySelection.problem_id);
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
                <h2 style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#0ff',
                    letterSpacing: '0.1em', marginBottom: '25px',
                    textShadow: '0 0 8px rgba(0,255,255,0.3)',
                }}>
                    ✓ SELECTED PROBLEM
                </h2>
                <div style={{
                    background: 'rgba(0,15,30,0.5)', border: '1px solid rgba(0,255,255,0.15)',
                    borderRadius: '8px', padding: '30px',
                }}>
                    <h3 style={{
                        fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem', color: '#fff',
                        letterSpacing: '0.05em', marginBottom: '15px',
                    }}>
                        {p?.title || 'Unknown Problem'}
                    </h3>
                    {[
                        { label: 'Description', value: p?.description },
                        { label: 'Requirements', value: p?.requirements },
                        { label: 'Deliverables', value: p?.deliverables },
                        { label: 'Evaluation Focus', value: p?.evaluation_focus },
                        { label: 'Resources', value: p?.resources },
                    ].filter((s) => s.value).map((s, i) => (
                        <div key={i} style={{ marginBottom: '20px' }}>
                            <div style={{
                                fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem',
                                color: 'rgba(0,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '8px',
                            }}>
                                {s.label.toUpperCase()}
                            </div>
                            <div style={{
                                fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
                                color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', whiteSpace: 'pre-wrap',
                            }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
            <h2 style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#0ff',
                letterSpacing: '0.1em', marginBottom: '20px',
                textShadow: '0 0 8px rgba(0,255,255,0.3)',
            }}>
                SELECT PROBLEM STATEMENT
            </h2>

            {!selConfig?.is_open ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.15)',
                    borderRadius: '12px',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔒</div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', color: '#ff6b6b', letterSpacing: '0.1em', marginBottom: '10px' }}>
                        SELECTION WINDOW CLOSED
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem' }}>
                        Problem statements will be revealed when the admin opens the selection window.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '20px' }}>
                        <div className="sci-fi-input-wrapper" style={{ maxWidth: '400px' }}>
                            <div className="sci-fi-icon">🔍</div>
                            <input type="text" className="sci-fi-input" placeholder="Search problems..."
                                value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                        {filtered.map((p) => {
                            const limit = parseInt(p.category) || 999;
                            const count = getCount(p.id);
                            const full = count >= limit;
                            const slotsLeft = Math.max(0, limit - count);

                            return (
                                <div key={p.id} style={{
                                    background: full ? 'rgba(30,10,10,0.4)' : 'rgba(0,15,30,0.5)',
                                    border: `1px solid ${full ? 'rgba(255,50,50,0.2)' : 'rgba(0,255,255,0.12)'}`,
                                    borderRadius: '8px', padding: '20px',
                                    opacity: full ? 0.6 : 1, transition: 'all 0.2s ease',
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column'
                                }}
                                    onClick={() => setViewingProblem(p)}
                                >
                                    <h4 style={{
                                        fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem',
                                        color: full ? 'rgba(255,255,255,0.5)' : '#fff', letterSpacing: '0.05em', marginBottom: '10px',
                                    }}>
                                        {p.title}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: '10px', fontSize: '0.7rem',
                                            background: full ? 'rgba(255,50,50,0.15)' : 'rgba(0,255,100,0.1)',
                                            color: full ? '#ff6b6b' : '#4ade80',
                                            fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em',
                                        }}>
                                            {full ? '🔒 FULL' : `${slotsLeft} SLOT${slotsLeft !== 1 ? 'S' : ''} LEFT`}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Rajdhani', sans-serif" }}>
                                            {count}/{limit} teams
                                        </span>
                                    </div>
                                    <p style={{
                                        fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem',
                                        color: 'rgba(255,255,255,0.6)', lineHeight: '1.5',
                                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden', marginBottom: '15px', flex: 1
                                    }}>
                                        {p.description}
                                    </p>

                                    {full ? (
                                        <div style={{
                                            width: '100%', padding: '8px', borderRadius: '6px', textAlign: 'center',
                                            background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)',
                                            color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', letterSpacing: '0.1em',
                                        }}>
                                            UNAVAILABLE
                                        </div>
                                    ) : (
                                        <button
                                            style={{
                                                width: '100%', padding: '8px', borderRadius: '6px', cursor: 'pointer',
                                                background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.25)',
                                                color: '#0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent modal opening if just selecting
                                                selConfig?.is_open && setConfirmId(p.id);
                                            }}
                                            disabled={!selConfig?.is_open}
                                        >SELECT</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '40px',
                            color: 'rgba(255,255,255,0.4)', fontFamily: "'Rajdhani', sans-serif",
                        }}>
                            No problems available.
                        </div>
                    )}
                </>
            )}

            {/* Glassmorphism Modal */}
            {viewingProblem && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    background: 'rgba(0, 5, 10, 0.7)', backdropFilter: 'blur(8px)',
                }}>
                    <div style={{
                        background: 'rgba(0,20,40,0.6)', border: '1px solid rgba(0,255,255,0.3)',
                        borderRadius: '12px', padding: '30px', maxWidth: '700px', width: '100%',
                        maxHeight: '85vh', overflowY: 'auto', position: 'relative',
                        boxShadow: '0 0 30px rgba(0,255,255,0.1)',
                    }}>
                        <button
                            onClick={() => { setViewingProblem(null); setConfirmId(null); }}
                            style={{
                                position: 'absolute', top: '20px', right: '20px', background: 'transparent',
                                border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer',
                            }}
                        >
                            ×
                        </button>
                        <h3 style={{
                            fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: '#fff',
                            letterSpacing: '0.05em', marginBottom: '8px', paddingRight: '30px'
                        }}>
                            {viewingProblem.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                            <span style={{
                                padding: '2px 10px', borderRadius: '10px', fontSize: '0.7rem',
                                background: getCount(viewingProblem.id) >= (parseInt(viewingProblem.category) || 999) ? 'rgba(255,50,50,0.15)' : 'rgba(0,255,100,0.1)',
                                color: getCount(viewingProblem.id) >= (parseInt(viewingProblem.category) || 999) ? '#ff6b6b' : '#4ade80',
                                fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em',
                            }}>
                                {getCount(viewingProblem.id) >= (parseInt(viewingProblem.category) || 999) ? '🔒 FULL' : `${Math.max(0, (parseInt(viewingProblem.category) || 999) - getCount(viewingProblem.id))} SLOT${Math.max(0, (parseInt(viewingProblem.category) || 999) - getCount(viewingProblem.id)) !== 1 ? 'S' : ''} LEFT`}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Rajdhani', sans-serif" }}>
                                {getCount(viewingProblem.id)}/{(parseInt(viewingProblem.category) || 999)} teams
                            </span>
                        </div>

                        {[
                            { label: 'Description', value: viewingProblem.description },
                            { label: 'Requirements', value: viewingProblem.requirements },
                            { label: 'Deliverables', value: viewingProblem.deliverables },
                            { label: 'Evaluation Focus', value: viewingProblem.evaluation_focus },
                            { label: 'Resources', value: viewingProblem.resources },
                        ].filter((s) => s.value).map((s, i) => (
                            <div key={i} style={{ marginBottom: '20px' }}>
                                <div style={{
                                    fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem',
                                    color: '#0ff', letterSpacing: '0.1em', marginBottom: '8px',
                                }}>
                                    {s.label.toUpperCase()}
                                </div>
                                <div style={{
                                    fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
                                    color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', whiteSpace: 'pre-wrap',
                                }}>
                                    {s.value}
                                </div>
                            </div>
                        ))}

                        {!mySelection && selConfig?.is_open && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                                {getCount(viewingProblem.id) >= (parseInt(viewingProblem.category) || 999) ? (
                                    <div style={{
                                        padding: '10px 20px', borderRadius: '6px', textAlign: 'center',
                                        background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)',
                                        color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', letterSpacing: '0.1em',
                                    }}>
                                        UNAVAILABLE
                                    </div>
                                ) : confirmId === viewingProblem.id ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => selectProblem(viewingProblem.id)} style={{
                                            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                                            background: 'rgba(0,255,100,0.15)', border: '1px solid rgba(0,255,100,0.4)',
                                            color: '#4ade80', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', letterSpacing: '0.1em',
                                        }}>CONFIRM SELECTION</button>
                                        <button onClick={() => setConfirmId(null)} style={{
                                            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                                            background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
                                            color: '#ff6b6b', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', letterSpacing: '0.1em',
                                        }}>CANCEL</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmId(viewingProblem.id)}
                                        style={{
                                            padding: '10px 30px', borderRadius: '6px', cursor: 'pointer',
                                            background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.4)',
                                            color: '#0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', letterSpacing: '0.1em',
                                            boxShadow: '0 0 10px rgba(0,255,255,0.2)'
                                        }}
                                    >SELECT PROBLEM</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
