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
                howlRef.current.unload();
                howlRef.current = null;
            }
            setIsPlaying(false);
            return;
        }

        // Initialize or re-initialize Howl instance if URL changes
        if (!howlRef.current || howlRef.current._src !== audioConfig.url) {
            if (howlRef.current) {
                howlRef.current.unload();
            }

            // Google Drive 'drive.google.com' CORS workaround
            let processedUrl = audioConfig.url;
            if (processedUrl.includes('drive.google.com/file/d/')) {
                const idMatch = processedUrl.match(/\/d\/(.*?)\//);
                if (idMatch && idMatch[1]) {
                    processedUrl = `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
                }
            } else if (processedUrl.includes('drive.google.com/uc')) {
                processedUrl = processedUrl.replace('drive.google.com', 'docs.google.com');
            }

            howlRef.current = new Howl({
                src: [processedUrl],
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
                },
                onstop: () => {
                    setIsPlaying(false);
                }
            });

            // If we've already had a user interaction in this session, attempt to play the new track automatically
            if (hasInteracted.current) {
                howlRef.current.play();
            }
        }

        return () => {
            // Let the audio track keep playing across navigations.
            // It will only be destroyed if the config gets disabled.
        };
    }, [audioConfig.url, audioConfig.is_enabled]);

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
        <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999 }}>
            <button
                onClick={togglePlay}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isPlaying ? 'rgba(0, 255, 255, 0.15)' : 'rgba(15, 15, 15, 0.8)',
                    border: `2px solid ${isPlaying ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 140, 0, 0.5)'}`,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: isPlaying ? '#0ff' : '#ff8c00',
                    cursor: 'pointer',
                    boxShadow: isPlaying ? '0 0 25px rgba(0, 255, 255, 0.3)' : '0 8px 16px rgba(0, 0, 0, 0.6)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.border = `2px solid ${isPlaying ? '#0ff' : '#ff8c00'}`;
                    e.currentTarget.style.boxShadow = isPlaying ? '0 0 30px rgba(0, 255, 255, 0.5)' : '0 0 20px rgba(255, 140, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = `2px solid ${isPlaying ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 140, 0, 0.5)'}`;
                    e.currentTarget.style.boxShadow = isPlaying ? '0 0 25px rgba(0, 255, 255, 0.3)' : '0 8px 16px rgba(0, 0, 0, 0.6)';
                }}
                title={isPlaying ? "Pause Background Music" : "Play Background Music"}
            >
                {/* Visualizer effect when playing */}
                {isPlaying && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 60%)',
                        animation: 'pulse-audio 2s infinite ease-in-out'
                    }} />
                )}

                {/* Icons */}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'absolute' }}>
                    {error ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                            <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                        </svg>
                    ) : isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style={{ marginLeft: '4px' }}>
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </span>

            </button>
            <style>{`
                @keyframes pulse-audio {
                    0% { transform: scale(0.85); opacity: 0.5; }
                    50% { transform: scale(1.15); opacity: 0.8; }
                    100% { transform: scale(0.85); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
