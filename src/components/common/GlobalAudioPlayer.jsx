import { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { Howl } from 'howler';

export default function GlobalAudioPlayer() {
    const [audioConfig, setAudioConfig] = useState({ url: '', is_enabled: false });
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(false);
    const howlRef = useRef(null);
    const hasInteracted = useRef(false);

    // Listen to Firestore for current global audio track
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'configs', 'audio_settings'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAudioConfig({
                    url: data.audio_url || '',
                    is_enabled: data.is_enabled === true
                });
            } else {
                setAudioConfig({ url: '', is_enabled: false });
            }
        });
        return () => unsubscribe();
    }, []);

    // Handle audio initialization, play/pause sync when config changes
    useEffect(() => {
        if (!audioConfig.is_enabled || !audioConfig.url) {
            // Stop immediately if disabled or URL is empty
            if (howlRef.current) {
                howlRef.current.stop();
                howlRef.current.unload();
                howlRef.current = null;
            }
            setIsPlaying(false);
            return;
        }

        // Initialize or re-initialize Howl instance if URL changes
        if (!howlRef.current || howlRef.current._src !== audioConfig.url) {
            if (howlRef.current) {
                howlRef.current.stop();
                howlRef.current.unload();
            }

            howlRef.current = new Howl({
                src: [audioConfig.url],
                html5: true, // Forces HTML5 Audio, crucial for streaming large files / bypassing some CORS
                loop: true,
                format: ['mp3', 'mpeg', 'wav', 'm4a'], // Hints to Howler to try these formats
                onloaderror: (id, err) => {
                    console.error("Howler Load Error:", err);
                    setError(true);
                    setIsPlaying(false);
                },
                onplayerror: (id, err) => {
                    console.error("Howler Play Error:", err);
                    howlRef.current.once('unlock', () => {
                        howlRef.current.play();
                    });
                },
                onplay: () => {
                    setIsPlaying(true);
                    setError(false);
                },
                onpause: () => {
                    setIsPlaying(false);
                }
            });
        }

        // Try to play if we've already had a user interaction or were previously playing
        if (hasInteracted.current || isPlaying) {
            if (!howlRef.current.playing()) {
                howlRef.current.play();
            }
        }

        return () => {
            // Cleanup happens on unmount or URL change
        };
    }, [audioConfig, isPlaying]);

    const togglePlay = () => {
        if (!howlRef.current || !audioConfig.is_enabled || !audioConfig.url) return;

        hasInteracted.current = true;

        if (howlRef.current.playing()) {
            howlRef.current.pause();
        } else {
            howlRef.current.play();
        }
    };

    // Don't render the UI toggle if the feature is completely disabled server-side
    // or if no URL is provided.
    if (!audioConfig.is_enabled || !audioConfig.url) {
        return null;
    }

    return (
        <div style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 9999 }}>
            <button
                onClick={togglePlay}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: isPlaying ? 'rgba(0, 255, 255, 0.1)' : 'rgba(20, 8, 0, 0.6)',
                    border: `1px solid ${isPlaying ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 140, 0, 0.3)'}`,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: isPlaying ? '#0ff' : '#ff8c00',
                    cursor: 'pointer',
                    boxShadow: isPlaying ? '0 0 15px rgba(0, 255, 255, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.border = `1px solid ${isPlaying ? 'rgba(0, 255, 255, 0.8)' : 'rgba(255, 140, 0, 0.8)'}`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = `1px solid ${isPlaying ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 140, 0, 0.3)'}`;
                }}
                title={isPlaying ? "Pause Background Music" : "Play Background Music"}
            >
                {/* Visualizer effect when playing */}
                {isPlaying && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 70%)',
                        animation: 'pulse-audio 2s infinite ease-in-out'
                    }} />
                )}

                {/* Icons */}
                <span style={{ fontSize: '1.2rem', zIndex: 1, position: 'absolute' }}>
                    {error ? '⚠️' : (isPlaying ? '⏸' : '🎵')}
                </span>

            </button>
            <style>{`
                @keyframes pulse-audio {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(0.8); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
