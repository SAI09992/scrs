import { useEffect, useState, useRef } from 'react';

export default function TitleReveal() {
    const [phase, setPhase] = useState(0);
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 200);
        const t2 = setTimeout(() => setPhase(2), 1200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const particles = Array.from({ length: 150 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: Math.random() * -0.6 - 0.2, // Drifting upwards
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.6 + 0.2,
            flickerSpeed: Math.random() * 0.05 + 0.01
        }));

        let time = 0;

        const draw = () => {
            time += 0.01;
            ctx.clearRect(0, 0, w, h);

            const bgGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
            bgGradient.addColorStop(0, '#1a1005');
            bgGradient.addColorStop(0.5, '#0a0500');
            bgGradient.addColorStop(1, '#000000');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, w, h);

            ctx.globalCompositeOperation = 'screen';
            const haloGrad = ctx.createRadialGradient(w / 2, h / 2 - 100, 0, w / 2, h / 2 - 100, 600);
            haloGrad.addColorStop(0, 'rgba(255, 170, 50, 0.15)');
            haloGrad.addColorStop(0.3, 'rgba(200, 90, 0, 0.05)');
            haloGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = haloGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';

            for (const p of particles) {
                p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.5; // Swirling motion
                p.y += p.vy;

                if (p.y < 0) {
                    p.y = h;
                    p.x = Math.random() * w;
                }
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;

                const currentAlpha = p.alpha * (0.5 + Math.sin(time * p.flickerSpeed * 100) * 0.5);

                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 180, 50, ${currentAlpha})`;
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0500',
                overflow: 'hidden',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />

            {/* Cinematic wide-screen bars (letterboxing) for movie feel */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8%', background: '#000', zIndex: 10 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8%', background: '#000', zIndex: 10 }} />

            {/* Title content */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 5,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Ancient-looking Devfest Text */}
                <h1
                    style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                        fontWeight: 800,
                        color: '#dfcfb1', // Aged bone/gold color
                        letterSpacing: '0.15em',
                        opacity: phase >= 1 ? 1 : 0,
                        transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                        transition: 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        textShadow: '0 0 20px rgba(255,160,50,0.4), 0 0 40px rgba(255,100,0,0.2)',
                        textTransform: 'uppercase',
                        marginBottom: '0',
                    }}
                >
                    DEVFEST 2.0
                </h1>

                {/* Kalki Title (Mythological Sci-Fi mix) */}
                <h2
                    style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '0.1em',
                        margin: '-10px 0 0 0',
                        opacity: phase >= 2 ? 1 : 0,
                        transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s',
                        background: 'linear-gradient(180deg, #ffffff 30%, #ffd700 70%, #ff8c00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: phase >= 2 ? 'drop-shadow(0 0 30px rgba(255, 150, 0, 0.6))' : 'none',
                    }}
                >
                    KALKI
                </h2>

                {/* Subtitle */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginTop: '20px',
                        opacity: phase >= 2 ? 1 : 0,
                        transition: 'opacity 2s ease 1.5s',
                    }}
                >
                    <div style={{ width: '40px', height: '1px', background: 'rgba(255,180,50,0.5)' }} />
                    <p
                        style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: 'clamp(0.7rem, 1.2vw, 1rem)',
                            color: '#d4af37',
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                        }}
                    >
                        2898 AD
                    </p>
                    <div style={{ width: '40px', height: '1px', background: 'rgba(255,180,50,0.5)' }} />
                </div>
            </div>
        </div>
    );
}
