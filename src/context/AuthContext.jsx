import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '../lib/firebaseClient';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const TEAM_SESSION_KEY = 'devfest-team-session';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimer = useRef(null);

    const restoreTeamSession = useCallback(() => {
        try {
            const stored = localStorage.getItem(TEAM_SESSION_KEY);
            if (stored) {
                const session = JSON.parse(stored);
                setUser({ id: session.team_id, email: session.email || '' });
                setProfile({
                    id: session.team_id,
                    email: session.email || '',
                    full_name: session.team_name,
                    role: 'participant',
                    team_id: session.team_id,
                    team_code: session.team_code,
                    teams: session.team_data || null,
                });
                return true;
            }
        } catch { }
        return false;
    }, []);

    const fetchProfile = useCallback(async (firebaseUser) => {
        const fallbackProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
            role: 'admin',
            team_id: null,
            teams: null,
        };

        try {
            const profileRef = doc(db, 'profiles', firebaseUser.uid);
            const profilePromise = getDoc(profileRef);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore timeout')), 5000)
            );
            const profileSnap = await Promise.race([profilePromise, timeoutPromise]);

            let teamData = null;
            if (profileSnap.exists()) {
                const profileData = { id: profileSnap.id, ...profileSnap.data() };
                if (profileData.team_id) {
                    try {
                        const teamRef = doc(db, 'teams', profileData.team_id);
                        const teamSnap = await getDoc(teamRef);
                        if (teamSnap.exists()) teamData = { id: teamSnap.id, ...teamSnap.data() };
                    } catch (e) { console.warn('Team fetch failed:', e.message); }
                }
                const fullProfile = { ...profileData, teams: teamData };
                setProfile(fullProfile);
                return fullProfile;
            }
        } catch (e) {
            console.warn('Profile fetch failed (using admin fallback):', e.message);
        }

        setProfile(fallbackProfile);
        return fallbackProfile;
    }, []);

    useEffect(() => {
        if (restoreTeamSession()) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser({ id: firebaseUser.uid, email: firebaseUser.email });
                try { await fetchProfile(firebaseUser); } catch { }
            } else {
                if (!localStorage.getItem(TEAM_SESSION_KEY)) {
                    setUser(null);
                    setProfile(null);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchProfile, restoreTeamSession]);

    const doSignOut = useCallback(async () => {
        const storedStr = localStorage.getItem(TEAM_SESSION_KEY);
        const isTeam = !!storedStr;

        if (isTeam) {
            try {
                const sessionStr = JSON.parse(storedStr);
                const teamId = sessionStr.team_id;
                const deviceId = localStorage.getItem('scrs_device_id');
                if (teamId && deviceId) {
                    const teamRef = doc(db, 'teams', teamId);
                    const teamSnap = await getDoc(teamRef);
                    if (teamSnap.exists()) {
                        const dat = teamSnap.data();
                        let activeDevices = Array.isArray(dat.active_devices) ? dat.active_devices : [];
                        if (activeDevices.includes(deviceId)) {
                            activeDevices = activeDevices.filter(d => d !== deviceId);
                            await updateDoc(teamRef, { active_devices: activeDevices });
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to cleanup session:', e);
            }
        }

        setUser(null);
        setProfile(null);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

        if (isTeam) {
            localStorage.removeItem(TEAM_SESSION_KEY);
        } else {
            try { await firebaseSignOut(auth); } catch { }
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        const resetTimer = () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(doSignOut, INACTIVITY_TIMEOUT);
        };
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [user, doSignOut]);

    const signIn = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = result.user;
        setUser({ id: firebaseUser.uid, email: firebaseUser.email });
        const profileData = await fetchProfile(firebaseUser);
        return { user: firebaseUser, profile: profileData };
    };

    const teamLogin = async (teamCode) => {
        const code = teamCode.trim().toUpperCase();
        const teamsRef = collection(db, 'teams');
        const q = query(teamsRef, where('team_code', '==', code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error('Invalid team code');

        const teamDoc = snapshot.docs[0];
        const team = { id: teamDoc.id, ...teamDoc.data() };

        let deviceId = localStorage.getItem('scrs_device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            localStorage.setItem('scrs_device_id', deviceId);
        }

        let activeDevices = Array.isArray(team.active_devices) ? [...team.active_devices] : [];
        if (!activeDevices.includes(deviceId)) {
            if (activeDevices.length >= 2) {
                throw new Error('Maximum devices (2) reached. Please log out from another device.');
            }
            activeDevices.push(deviceId);
            try {
                const teamRef = doc(db, 'teams', team.id);
                await updateDoc(teamRef, { active_devices: activeDevices });
            } catch (err) {
                throw new Error('Failed to register device session: ' + err.message);
            }
        }

        const session = {
            team_id: team.id,
            team_name: team.name,
            team_code: team.team_code,
            email: '',
            team_data: team,
            device_id: deviceId
        };
        localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(session));

        setUser({ id: team.id, email: '' });
        setProfile({
            id: team.id,
            email: '',
            full_name: team.name,
            role: 'participant',
            team_id: team.id,
            team_code: team.team_code,
            teams: team,
        });

        return { team };
    };

    const signOut = doSignOut;

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        profile,
        loading,
        signIn,
        teamLogin,
        signOut,
        resetPassword,
        isAdmin: profile?.role === 'admin',
        isParticipant: profile?.role === 'participant',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
