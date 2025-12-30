const express = require('express');
const path = require('path');
const { loadGames, getGameById, getRandomGame, getGameIds, selectGameWords } = require('./categories');

const PUBLIC_DIR = path.join(__dirname, '../public');
const INDEX = path.join(PUBLIC_DIR, 'index.html');

const app = express();
app.use(express.json());

loadGames();

// API endpoint to get a new game
// Query params:
//   - kidmode: "true" to get kid-friendly games
//   - id: specific game ID to load
//   - words: comma-separated list of specific words to use from the game
app.get('/api/newgame', (req, res) => {
    const kidMode = req.query.kidmode === 'true';
    const requestedId = req.query.id;
    const requestedWords = req.query.words ? req.query.words.split(',').map(w => w.trim()) : null;

    let game;
    if (requestedId) {
        // Load specific game by ID
        game = getGameById(requestedId, kidMode);
        if (!game) {
            return res.status(404).json({ error: `Game with id '${requestedId}' not found` });
        }
    } else {
        // Pick a random game
        game = getRandomGame(kidMode);
        if (!game) {
            return res.status(404).json({ error: 'No games available' });
        }
    }

    // Select words for the game (either specific requested words or random selection)
    try {
        game = selectGameWords(game, requestedWords);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    // Return game data (shuffle words so categories aren't obvious)
    // At this point, all words are normalized to {text, lightColor, darkColor} objects
    const allWords = game.categories.flatMap(cat => 
        cat.words.map(word => ({ ...word, category: cat.name }))
    );

    // Fisher-Yates shuffle
    for (let i = allWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    res.json({
        id: game.id,
        kidMode: game.kidMode,
        words: allWords.map(w => ({ text: w.text, lightColor: w.lightColor, darkColor: w.darkColor })),
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
    
    res.json({
        games: getGameIds(kidMode)
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