import { useRef, useEffect } from 'react';

export default function WarpLoader() {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

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

        const STAR_COUNT = 800;
        const stars = Array.from({ length: STAR_COUNT }, () => ({
            x: (Math.random() - 0.5) * w * 3,
            y: (Math.random() - 0.5) * h * 3,
            z: Math.random() * 1500 + 500,
            pz: 0,
            color: Math.random() > 0.05
                ? `hsla(${30 + Math.random() * 25}, ${80 + Math.random() * 20}%, ${50 + Math.random() * 30}%, 1)`
                : `hsla(180, 80%, 60%, 0.8)`,
        }));

        let speed = 1.5;
        const startTime = performance.now();

        const draw = (now) => {
            const elapsed = (now - startTime) / 1000;
            speed = 1.5 + elapsed * 6;

            ctx.fillStyle = 'rgba(5, 3, 0, 0.2)';
            ctx.fillRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;

            for (const star of stars) {
                star.pz = star.z;
                star.z -= speed;

                if (star.z <= 0) {
                    star.x = (Math.random() - 0.5) * w * 3;
                    star.y = (Math.random() - 0.5) * h * 3;
                    star.z = 1500;
                    star.pz = 1500;
                }

                const sx = (star.x / star.z) * w * 0.4 + cx;
                const sy = (star.y / star.z) * h * 0.4 + cy;
                const px = (star.x / star.pz) * w * 0.4 + cx;
                const py = (star.y / star.pz) * h * 0.4 + cy;

                const size = Math.max(0.2, (1 - star.z / 1500) * 3);
                const alpha = Math.min(1, (1 - star.z / 1500) * 1.5);

                ctx.beginPath();
                ctx.strokeStyle = star.color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = size * 1.5;
                ctx.moveTo(px, py);
                ctx.lineTo(sx, sy);
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = alpha * 0.9;
                ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }

            const pulse = Math.sin(elapsed * 3) * 0.1;
            const coreSize = 250 + pulse * 50;

            ctx.globalAlpha = 0.8;
            const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
            coreGradient.addColorStop(0, 'rgba(255, 230, 200, 1)');
            coreGradient.addColorStop(0.1, 'rgba(255, 180, 50, 0.8)');
            coreGradient.addColorStop(0.4, 'rgba(200, 100, 0, 0.4)');
            coreGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = coreGradient;
            ctx.fillRect(cx - coreSize, cy - coreSize, coreSize * 2, coreSize * 2);

            const sciFiCoreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 0.5);
            sciFiCoreGradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            sciFiCoreGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = sciFiCoreGradient;
            ctx.fillRect(cx - coreSize, cy - coreSize, coreSize * 2, coreSize * 2);

            ctx.globalAlpha = 1;
            animRef.current = requestAnimationFrame(draw);
        };

        ctx.fillStyle = '#050300';
        ctx.fillRect(0, 0, w, h);
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
                background: '#050300',
                overflow: 'hidden',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
            />

            {/* Heavy vignette for cinematic feel */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 20%, rgba(5,2,0,0.9) 100%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            />
        </div>
    );
}
