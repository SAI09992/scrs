import { useState, useEffect, useRef } from 'react';

export default function IntroVideo({ onComplete }) {
    const videoRef = useRef(null);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnded = () => {
            setFadeOut(true);
            setTimeout(() => onComplete(), 800);
        };

        video.addEventListener('ended', handleEnded);
        video.play().catch(() => {
            onComplete();
        });

        return () => video.removeEventListener('ended', handleEnded);
    }, [onComplete]);

    const handleSkip = () => {
        setFadeOut(true);
        setTimeout(() => onComplete(), 500);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.8s ease-out',
        }}>
            <video
                ref={videoRef}
                src="/videos/intro.mp4"
                muted
                playsInline
                style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                }}
            />
            <button
                onClick={handleSkip}
                style={{
                    position: 'absolute', bottom: '30px', right: '30px',
                    padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                    color: 'rgba(255,255,255,0.6)', fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.6rem', letterSpacing: '0.15em',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            >
                SKIP ▶
            </button>
        </div>
    );
}
