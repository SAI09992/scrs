import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WarpLoader from './WarpLoader';
import TitleReveal from './TitleReveal';
import PresentedBy from './PresentedBy';

const SCENE_DURATIONS = [3500, 4000, 3000];

export default function IntroSequence() {
    const navigate = useNavigate();
    const [currentScene, setCurrentScene] = useState(0);
    const [phase, setPhase] = useState('active');

    const transitionToNext = useCallback(() => {
        setPhase('fade-out');
        setTimeout(() => {
            setCurrentScene((prev) => prev + 1);
            setPhase('fade-in');
            setTimeout(() => setPhase('active'), 800);
        }, 800);
    }, []);

    useEffect(() => {
        if (currentScene < SCENE_DURATIONS.length) {
            const timer = setTimeout(() => transitionToNext(), SCENE_DURATIONS[currentScene]);
            return () => clearTimeout(timer);
        } else {
            navigate('/login', { replace: true });
        }
    }, [currentScene, transitionToNext, navigate]);

    const getSceneStyle = () => {
        switch (phase) {
            case 'fade-out':
                return { opacity: 0, transform: 'scale(1.05)', filter: 'blur(15px)', transition: 'all 0.8s cubic-bezier(0.4, 0, 1, 1)' };
            case 'fade-in':
                return { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)', transition: 'all 0.8s ease-out' };
            default:
                return { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)', transition: 'all 0.5s ease-out' };
        }
    };

    const renderScene = () => {
        switch (currentScene) {
            case 0: return <WarpLoader />;
            case 1: return <TitleReveal />;
            case 2: return <PresentedBy />;
            default: return null;
        }
    };

    return (
        <div style={{
            width: '100vw', height: '100vh', position: 'fixed', inset: 0,
            background: '#000', overflow: 'hidden',
        }}>
            <div style={{ width: '100%', height: '100%', ...getSceneStyle() }}>
                {renderScene()}
            </div>
        </div>
    );
}
