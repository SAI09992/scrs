import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const envSrc = fs.readFileSync('.env', 'utf-8').replace(/\r/g, '');
const config = {};
envSrc.split('\n').forEach(line => {
    const match = line.match(/^VITE_FIREBASE_([A-Z_]+)=(.*)$/);
    if (match) config['VITE_FIREBASE_' + match[1]] = match[2].trim().replace(/['"]/g, '');
});

const app = initializeApp({
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID
});

const db = getFirestore(app);

async function clean() {
    console.log('Fetching teams...');
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const teams = [];
    teamsSnap.forEach(d => teams.push({ id: d.id, ...d.data() }));

    const byCode = {};
    teams.forEach(t => {
        if (!byCode[t.team_code]) byCode[t.team_code] = [];
        byCode[t.team_code].push(t);
    });

    let deletedTeams = 0;
    const keepTeamIds = new Set();

    for (const code of Object.keys(byCode)) {
        const list = byCode[code];
        list.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
        keepTeamIds.add(list[0].id);
        for (let i = 1; i < list.length; i++) {
            await deleteDoc(doc(db, 'teams', list[i].id));
            deletedTeams++;
        }
    }
    console.log('Deleted duplicate teams:', deletedTeams);

    console.log('Fetching selections...');
    const selSnap = await getDocs(collection(db, 'selections'));
    const selections = [];
    selSnap.forEach(d => selections.push({ id: d.id, ...d.data() }));

    let deletedSelections = 0;
    const selByTeam = {};

    for (const sel of selections) {
        if (!keepTeamIds.has(sel.team_id)) {
            await deleteDoc(doc(db, 'selections', sel.id));
            deletedSelections++;
        } else {
            if (!selByTeam[sel.team_id]) selByTeam[sel.team_id] = [];
            selByTeam[sel.team_id].push(sel);
        }
    }

    for (const teamId of Object.keys(selByTeam)) {
        const list = selByTeam[teamId];
        if (list.length > 1) {
            list.sort((a, b) => new Date(b.selected_at || 0) - new Date(a.selected_at || 0));
            for (let i = 1; i < list.length; i++) {
                await deleteDoc(doc(db, 'selections', list[i].id));
                deletedSelections++;
            }
        }
    }
    console.log('Deleted duplicate/orphaned selections:', deletedSelections);
    process.exit(0);
}

clean().catch(console.error);
