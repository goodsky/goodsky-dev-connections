const path = require('path');
const fs = require('fs');

const GAMES_DIR = path.join(__dirname, 'games');

// Store all games in memory
const games = {
    regular: {},
    kid: {}
};

/**
 * Load all games from the games directory
 */
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

/**
 * Get all games for a specific mode
 * @param {boolean} kidMode - Whether to get kid games or regular games
 * @returns {Object} Object containing all games for the specified mode
 */
function getGames(kidMode) {
    return kidMode ? games.kid : games.regular;
}

/**
 * Get a specific game by ID and mode
 * @param {string} gameId - The ID of the game to retrieve
 * @param {boolean} kidMode - Whether to look in kid games or regular games
 * @returns {Object|null} The game object or null if not found
 */
function getGameById(gameId, kidMode) {
    const gamePool = getGames(kidMode);
    return gamePool[gameId] || null;
}

/**
 * Get a random game from the specified mode
 * @param {boolean} kidMode - Whether to get a kid game or regular game
 * @returns {Object|null} A random game object or null if no games available
 */
function getRandomGame(kidMode) {
    const gamePool = getGames(kidMode);
    const gameIds = Object.keys(gamePool);
    
    if (gameIds.length === 0) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * gameIds.length);
    return gamePool[gameIds[randomIndex]];
}

/**
 * Get list of all game IDs for a specific mode
 * @param {boolean} kidMode - Whether to get kid game IDs or regular game IDs
 * @returns {string[]} Array of game IDs
 */
function getGameIds(kidMode) {
    const gamePool = getGames(kidMode);
    return Object.keys(gamePool);
}

/**
 * Randomly select 4 words from a category
 * @param {string[]} words - Array of words in a category
 * @returns {string[]} Array of 4 randomly selected words
 */
function selectRandomWords(words) {
    if (words.length <= 4) {
        return [...words];
    }
    
    // Fisher-Yates shuffle and take first 4
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, 4);
}

/**
 * Select specific words from categories or randomly select if not specified
 * @param {Object} game - The game object
 * @param {string[]|null} requestedWords - Array of specific words to use (or null for random selection)
 * @returns {Object} Game object with selected words (4 per category)
 */
function selectGameWords(game, requestedWords) {
    if (requestedWords && requestedWords.length > 0) {
        // Use specific requested words
        const requestedSet = new Set(requestedWords.map(w => w.toUpperCase()));
        
        // Validate that all requested words exist in the game
        const allGameWords = game.categories.flatMap(cat => cat.words);
        const allGameWordsUpper = new Set(allGameWords.map(w => w.toUpperCase()));
        
        for (const word of requestedWords) {
            if (!allGameWordsUpper.has(word.toUpperCase())) {
                throw new Error(`Word '${word}' not found in game`);
            }
        }
        
        // Filter categories to only include requested words
        const selectedCategories = game.categories.map(cat => {
            const selectedWords = cat.words.filter(w => requestedSet.has(w.toUpperCase()));
            return {
                ...cat,
                words: selectedWords
            };
        }).filter(cat => cat.words.length > 0);
        
        return {
            ...game,
            categories: selectedCategories
        };
    } else {
        // Randomly select 4 words from each category
        const selectedCategories = game.categories.map(cat => ({
            ...cat,
            words: selectRandomWords(cat.words)
        }));
        
        return {
            ...game,
            categories: selectedCategories
        };
    }
}

module.exports = {
    loadGames,
    getGames,
    getGameById,
    getRandomGame,
    getGameIds,
    selectGameWords
};
