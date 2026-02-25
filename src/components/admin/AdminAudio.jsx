import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminAudio() {
    const [audioUrl, setAudioUrl] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const docRef = doc(db, 'configs', 'audio_settings');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAudioUrl(data.audio_url || '');
                setIsEnabled(data.is_enabled || false);
            }
        } catch (e) {
            console.error("Failed to load audio settings:", e);
            setMessage('Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const docRef = doc(db, 'configs', 'audio_settings');
            await setDoc(docRef, {
                audio_url: audioUrl.trim(),
                is_enabled: isEnabled,
                updated_at: new Date()
            }, { merge: true });

            setMessage('Audio settings updated successfully! All active users will hear the change instantly.');
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setMessage('Error saving settings: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ color: '#0ff', fontFamily: "'Orbitron', sans-serif" }}>Loading Audio Config...</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <h1 style={{ fontFamily: "'Orbitron', sans-serif", color: '#ff8c00', fontSize: '1.8rem', marginBottom: '20px', letterSpacing: '0.1em' }}>
                GLOBAL AUDIO CONTROL
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px', fontSize: '1.1rem' }}>
                Manage the background music track that plays for all participants across the platform. Changes here are synced in real-time.
            </p>

            {message && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    background: message.includes('Error') ? 'rgba(255,50,50,0.1)' : 'rgba(0,255,255,0.1)',
                    border: `1px solid ${message.includes('Error') ? 'rgba(255,50,50,0.4)' : 'rgba(0,255,255,0.4)'}`,
                    borderRadius: '8px',
                    color: message.includes('Error') ? '#ff6b6b' : '#0ff',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.9rem'
                }}>
                    {message}
                </div>
            )}

            <div style={{
                background: 'rgba(20,8,0,0.6)',
                border: '1px solid rgba(255,140,0,0.3)',
                borderRadius: '12px',
                padding: '30px',
                backdropFilter: 'blur(10px)'
            }}>
                <form onSubmit={handleSave}>

                    {/* Toggle Switch */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", color: '#ff8c00', fontSize: '1.1rem' }}>
                            GLOBAL AUDIO:
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEnabled(!isEnabled)}
                            style={{
                                width: '60px', height: '30px', borderRadius: '15px',
                                background: isEnabled ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                border: `1px solid ${isEnabled ? '#0ff' : 'rgba(255,255,255,0.3)'}`,
                                position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: '2px', left: isEnabled ? '32px' : '2px',
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: isEnabled ? '#0ff' : '#aaa', transition: 'all 0.3s ease',
                                boxShadow: isEnabled ? '0 0 10px #0ff' : 'none'
                            }} />
                        </button>
                        <span style={{ fontSize: '1.1rem', color: isEnabled ? '#0ff' : '#aaa', textTransform: 'uppercase' }}>
                            {isEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                    </div>

                    {/* URL Input */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>
                            AUDIO URL (MP3/WAV)
                        </label>
                        <input
                            type="url"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            placeholder="https://example.com/soundtrack.mp3"
                            style={{
                                width: '100%', padding: '12px 15px',
                                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,140,0,0.4)',
                                borderRadius: '6px', color: '#ff8c00', fontSize: '1rem',
                                outline: 'none', fontFamily: "monospace"
                            }}
                            disabled={!isEnabled}
                        />
                        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                            URL must point directly to a playable audio file. Ensure the server supports CORS if hosting externally.
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            padding: '12px 25px',
                            background: 'linear-gradient(45deg, rgba(255,140,0,0.2) 0%, rgba(200,50,0,0.4) 100%)',
                            border: '1px solid #ff8c00',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontFamily: "'Orbitron', sans-serif",
                            cursor: saving ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 0 15px rgba(255,140,0,0.2)'
                        }}
                    >
                        {saving ? 'SYNCING...' : 'SAVE & SYNC TRACK'}
                    </button>
                </form>
            </div>
        </div>
    );
}
