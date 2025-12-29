const express = require('express');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '../public');
const INDEX = path.join(PUBLIC_DIR, 'index.html');
const GAMES_DIR = path.join(__dirname, 'games');

const app = express();
app.use(express.json());

// Load all games into memory
const games = {
    regular: {},
    kid: {}
};

function loadGames() {
    // Load regular games
    const regularDir = path.join(GAMES_DIR, 'regular');
    if (fs.existsSync(regularDir)) {
        fs.readdirSync(regularDir).forEach(file => {
            if (file.endsWith('.json')) {
                const game = JSON.parse(fs.readFileSync(path.join(regularDir, file), 'utf8'));
                games.regular[game.id] = game;
            }
        });
    }

    // Load kid games
    const kidDir = path.join(GAMES_DIR, 'kid');
    if (fs.existsSync(kidDir)) {
        fs.readdirSync(kidDir).forEach(file => {
            if (file.endsWith('.json')) {
                const game = JSON.parse(fs.readFileSync(path.join(kidDir, file), 'utf8'));
                games.kid[game.id] = game;
            }
        });
    }

    console.log(`Loaded ${Object.keys(games.regular).length} regular games and ${Object.keys(games.kid).length} kid games`);
}

loadGames();

// API endpoint to get a new game
// Query params:
//   - kidmode: "true" to get kid-friendly games
//   - id: specific game ID to load
app.get('/api/newgame', (req, res) => {
    const kidMode = req.query.kidmode === 'true';
    const requestedId = req.query.id;

    const gamePool = kidMode ? games.kid : games.regular;
    const gameIds = Object.keys(gamePool);

    if (gameIds.length === 0) {
        return res.status(404).json({ error: 'No games available' });
    }

    let game;
    if (requestedId && gamePool[requestedId]) {
        // Load specific game by ID
        game = gamePool[requestedId];
    } else {
        // Pick a random game
        const randomIndex = Math.floor(Math.random() * gameIds.length);
        game = gamePool[gameIds[randomIndex]];
    }

    // Return game data (shuffle words so categories aren't obvious)
    const allWords = game.categories.flatMap(cat => 
        cat.words.map(word => ({ word, category: cat.name }))
    );
    
    // Fisher-Yates shuffle
    for (let i = allWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    res.json({
        id: game.id,
        kidMode: game.kidMode,
        words: allWords.map(w => w.word),
        categories: game.categories.map(cat => ({
            name: cat.name,
            difficulty: cat.difficulty,
            words: cat.words
        }))
    });
});

// API endpoint to list available games
app.get('/api/games', (req, res) => {
    const kidMode = req.query.kidmode === 'true';
    const gamePool = kidMode ? games.kid : games.regular;
    
    res.json({
        games: Object.keys(gamePool)
    });
});

// Serve the client application
app.use(express.static(PUBLIC_DIR));

app.get('/*splat', (req, res) => {
    res.sendFile(INDEX);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});