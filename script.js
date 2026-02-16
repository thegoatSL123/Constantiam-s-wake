// --- FIREBASE CONFIGURATION ---
// Replace the block below with your actual Firebase config from the Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- CORE FUNCTIONS ---

function getPlayerFace(username) {
    return `https://crafatar.com/avatars/${username}?size=64&overlay`;
}

// 1. REGISTER PLAYER (Verification + Hide Button)
async function registerPlayer() {
    const inputField = document.getElementById('usernameInput');
    const username = inputField.value.trim();
    if (!username) return;

    try {
        // Verify on NameMC/Mojang
        const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);
        if (response.status === 404) {
            alert("This account does not exist on NameMC.");
            return;
        }

        // Push to Cloud Database
        const playerRef = database.ref('players');
        playerRef.push(username);

        // Hide the UI for this user
        hideRegistration();
        localStorage.setItem('has_registered_wake', 'true');

    } catch (error) {
        alert("Error connecting to database.");
    }
}

function hideRegistration() {
    document.getElementById('register-ui').classList.add('hidden');
    document.getElementById('welcome-msg').classList.remove('hidden');
}

// 2. SYNC PLAYERS (Listen for new names worldwide)
database.ref('players').on('value', (snapshot) => {
    const data = snapshot.val();
    const players = data ? Object.values(data) : [];
    renderPlayers(players);
});

function renderPlayers(players) {
    const container = document.getElementById('top-players');
    container.innerHTML = '';

    // The first 3 are The Vanguard (Gold)
    players.slice(0, 3).forEach(name => {
        container.innerHTML += `
            <div class="player-card">
                <img src="${getPlayerFace(name)}" alt="${name}">
                <div style="color: #ffd700; font-weight: bold;">${name}</div>
            </div>
        `;
    });
}

// 3. AUTO-CLEANUP (Runs every 5 mins to remove dead accounts)
async function cleanCloudList() {
    database.ref('players').once('value', async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        for (const [key, name] of Object.entries(data)) {
            try {
                const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`);
                if (response.status === 404) {
                    database.ref('players/' + key).remove(); // Delete from Cloud
                }
            } catch (e) { /* Skip if API is down */ }
        }
    });
}

setInterval(cleanCloudList, 300000);

// On Page Load: Check if they've already joined
window.onload = () => {
    if (localStorage.getItem('has_registered_wake') === 'true') {
        hideRegistration();
    }
};function toggleSuggestions() {
    const box = document.getElementById('suggestion-box');
    if (box.classList.contains('hidden')) {
        box.classList.remove('hidden');
        // Smooth scroll to the box so the player sees it
        box.scrollIntoView({ behavior: 'smooth' });
    } else {
        box.classList.add('hidden');
    }
}