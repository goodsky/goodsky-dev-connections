<script>
    import { onMount } from 'svelte';
    import MenuBar from './MenuBar.svelte';

    // Difficulty colors matching NYT (yellow, green, blue, purple)
    const DIFFICULTY_COLORS = [
        { bg: '#f9df6d', text: '#000000' }, // Yellow - easiest
        { bg: '#a0c35a', text: '#000000' }, // Green
        { bg: '#b0c4ef', text: '#000000' }, // Blue
        { bg: '#ba81c5', text: '#000000' }  // Purple - hardest
    ];

    // Game state
    let kidMode = $state(false);
    let gameId = $state(null);
    let words = $state([]);           // Current words in grid (not yet solved)
    let categories = $state([]);      // All category definitions
    let selectedWords = $state([]);   // Currently selected words
    let solvedCategories = $state([]); // Categories that have been solved
    let retriesLeft = $state(4);
    let shakingWords = $state([]);    // Words currently shaking (wrong guess)
    let isLoading = $state(true);
    
    // Game end states
    let gameWon = $state(false);
    let gameLost = $state(false);
    let revealingCategories = $state(false);
    let revealedCount = $state(0);

    // Share modal
    let showShareModal = $state(false);
    let shareUrl = $state('');
    let copiedToClipboard = $state(false);

    const MAX_SELECTION = 4;
    const TOTAL_RETRIES = 4;

    // Track if initial load has happened
    let initialLoadDone = false;

    // Computed values
    let canSubmit = $derived(selectedWords.length === MAX_SELECTION);

    // Parse URL parameters on mount
    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const urlKidMode = params.get('kidmode') === 'true';
        const urlGameId = params.get('game');
        
        kidMode = urlKidMode;
        gameId = urlGameId;
    });

    // Watch for kid mode changes to load a new game
    $effect(() => {
        loadGame(kidMode, gameId);
    });

    async function loadGame(kidMode, specificGameId = null) {
        console.log('Loading game with kidMode:', kidMode, 'gameId:', specificGameId);
        isLoading = true;
        
        try {
            let url = `/api/newgame?kidmode=${kidMode}`;
            if (specificGameId) {
                url += `&id=${specificGameId}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to load game');
            }
            
            const data = await response.json();
            
            // Reset game state
            gameId = data.id;
            words = [...data.words];
            categories = data.categories;
            selectedWords = [];
            solvedCategories = [];
            retriesLeft = TOTAL_RETRIES;
            shakingWords = [];
            gameWon = false;
            gameLost = false;
            revealingCategories = false;
            revealedCount = 0;

            // Update URL without reload
            updateUrl();
        } catch (error) {
            console.error('Error loading game:', error);
        } finally {
            isLoading = false;
            initialLoadDone = true;
        }
    }

    function updateUrl() {
        const params = new URLSearchParams();
        if (gameId) params.set('game', gameId);
        if (kidMode) params.set('kidmode', 'true');
        
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }

    function toggleWordSelection(word) {
        if (gameWon || gameLost || revealingCategories) return;
        
        if (selectedWords.includes(word)) {
            selectedWords = selectedWords.filter(w => w !== word);
        } else if (selectedWords.length < MAX_SELECTION) {
            selectedWords = [...selectedWords, word];
        }
    }

    function shuffleWords() {
        // Fisher-Yates shuffle
        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        words = shuffled;
    }

    function deselectAll() {
        selectedWords = [];
    }

    function submitGuess() {
        if (!canSubmit) return;

        // Check if selected words match any category
        const matchedCategory = categories.find(cat => {
            const catWords = cat.words;
            return selectedWords.every(w => catWords.includes(w)) &&
                   catWords.every(w => selectedWords.includes(w));
        });

        if (matchedCategory) {
            // Correct guess!
            solvedCategories = [...solvedCategories, matchedCategory];
            words = words.filter(w => !selectedWords.includes(w));
            selectedWords = [];

            // Check for win
            if (solvedCategories.length === 4) {
                gameWon = true;
            }
        } else {
            // Wrong guess - shake and decrement retries
            shakingWords = [...selectedWords];
            
            // Only decrement retries in non-kid mode
            if (!kidMode) {
                retriesLeft--;
                
                if (retriesLeft === 0) {
                    // Game over - reveal categories
                    setTimeout(() => {
                        shakingWords = [];
                        selectedWords = [];
                        startRevealingCategories();
                    }, 600);
                    return;
                }
            }

            // Clear shake after animation
            setTimeout(() => {
                shakingWords = [];
            }, 600);
        }
    }

    function startRevealingCategories() {
        gameLost = true;
        revealingCategories = true;
        revealedCount = 0;
        
        // Reveal unsolved categories one by one
        const unsolvedCategories = categories.filter(
            cat => !solvedCategories.some(solved => solved.name === cat.name)
        );
        
        // Sort by difficulty for reveal order
        unsolvedCategories.sort((a, b) => a.difficulty - b.difficulty);

        let revealIndex = 0;
        const revealInterval = setInterval(() => {
            if (revealIndex < unsolvedCategories.length) {
                const catToReveal = unsolvedCategories[revealIndex];
                solvedCategories = [...solvedCategories, catToReveal];
                words = words.filter(w => !catToReveal.words.includes(w));
                revealedCount++;
                revealIndex++;
            } else {
                clearInterval(revealInterval);
                revealingCategories = false;
            }
        }, 1000);
    }

    function handleNewGame() {
        loadGame(kidMode, null);
    }

    function handleShareGame() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        if (gameId) params.set('game', gameId);
        if (kidMode) params.set('kidmode', 'true');
        
        shareUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        copiedToClipboard = false;
        showShareModal = true;
    }

    function copyShareUrl() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            copiedToClipboard = true;
            setTimeout(() => {
                copiedToClipboard = false;
            }, 2000);
        });
    }

    function closeShareModal() {
        showShareModal = false;
    }

    function closeWinModal() {
        gameWon = false;
    }

    function closeLoseModal() {
        gameLost = false;
        revealingCategories = false;
    }
</script>

<div class="game-container">
    <MenuBar 
        bind:kidMode={kidMode}
        onNewGame={handleNewGame} 
        onShareGame={handleShareGame} 
    />

    <main class="game-content">
        {#if isLoading}
            <div class="loading">Loading...</div>
        {:else}
            <p class="instructions">Create four groups of four!</p>

            <!-- Solved Categories -->
            <div class="grid-container">
                {#each solvedCategories as category}
                    <div 
                        class="solved-category"
                        style="background-color: {DIFFICULTY_COLORS[category.difficulty].bg}; color: {DIFFICULTY_COLORS[category.difficulty].text};"
                    >
                        <div class="category-name">{category.name}</div>
                        <div class="category-words">{category.words.join(', ')}</div>
                    </div>
                {/each}

                <!-- Remaining Word Grid -->
                {#if words.length > 0}
                    <div class="words-grid" style="--rows: {Math.ceil(words.length / 4)}">
                        {#each words as word}
                            <button
                                class="word-tile"
                                class:selected={selectedWords.includes(word)}
                                class:shaking={shakingWords.includes(word)}
                                onclick={() => toggleWordSelection(word)}
                                disabled={gameWon || revealingCategories}
                            >
                                {word}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Retry Indicators (hidden in kid mode) -->
            {#if !kidMode}
                <div class="retries-container">
                    <span class="retries-label">Mistakes remaining:</span>
                    <div class="retries-dots">
                        {#each Array(TOTAL_RETRIES) as _, i}
                            <div 
                                class="retry-dot"
                                class:used={i >= retriesLeft}
                            ></div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Control Buttons -->
            <div class="controls">
                <button 
                    class="control-btn"
                    onclick={shuffleWords}
                    disabled={words.length === 0 || gameWon || revealingCategories}
                >
                    Shuffle
                </button>
                <button 
                    class="control-btn"
                    onclick={deselectAll}
                    disabled={selectedWords.length === 0 || gameWon || revealingCategories}
                >
                    Deselect All
                </button>
                <button 
                    class="control-btn submit-btn"
                    onclick={submitGuess}
                    disabled={!canSubmit || gameWon || revealingCategories}
                >
                    Submit
                </button>
            </div>
        {/if}
    </main>

    <!-- Win Modal -->
    {#if gameWon && !revealingCategories}
        <div class="modal-overlay" role="button" tabindex="0" onclick={closeWinModal} onkeydown={(e) => e.key === 'Enter' && closeWinModal()}>
            <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
                <h2>🎉 Congratulations! 🎉</h2>
                <p>You solved the puzzle!</p>
                <div class="modal-buttons">
                    <button class="modal-btn" onclick={closeWinModal}>
                        Admire Puzzle
                    </button>
                    <button class="modal-btn primary" onclick={handleNewGame}>
                        New Game
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Lose Modal (shows after reveal) -->
    {#if gameLost && !revealingCategories}
        <div class="modal-overlay" role="button" tabindex="0" onclick={closeLoseModal} onkeydown={(e) => e.key === 'Enter' && closeLoseModal()}>
            <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
                <h2>Game Over</h2>
                <p>Better luck next time!</p>
                <div class="modal-buttons">
                    <button class="modal-btn" onclick={closeLoseModal}>
                        Admire Puzzle
                    </button>
                    <button class="modal-btn primary" onclick={handleNewGame}>
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Share Modal -->
    {#if showShareModal}
        <div class="modal-overlay" role="button" tabindex="0" onclick={closeShareModal} onkeydown={(e) => e.key === 'Enter' && closeShareModal()}>
            <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
                <h2>Share Game</h2>
                <p>Share this puzzle with a friend:</p>
                <div class="share-url-container">
                    <input 
                        type="text" 
                        readonly 
                        value={shareUrl}
                        class="share-url-input"
                    />
                    <button class="copy-btn" onclick={copyShareUrl}>
                        {copiedToClipboard ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div class="modal-buttons">
                    <button class="modal-btn" onclick={closeShareModal}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background-color: #121213;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .game-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .game-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem;
        max-width: 600px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
    }

    .loading {
        color: #818384;
        font-size: 1.25rem;
        margin-top: 4rem;
    }

    .instructions {
        color: #818384;
        font-size: 1rem;
        margin-bottom: 1.5rem;
    }

    .grid-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    /* Solved Category Row */
    .solved-category {
        width: 100%;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        box-sizing: border-box;
    }

    .category-name {
        font-weight: 700;
        font-size: 1rem;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
    }

    .category-words {
        font-size: 0.875rem;
        text-transform: uppercase;
    }

    /* Word Grid */
    .words-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        width: 100%;
    }

    .word-tile {
        aspect-ratio: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #5a5a5c;
        border: none;
        border-radius: 8px;
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        cursor: pointer;
        transition: background-color 0.15s, transform 0.15s;
        padding: 0.5rem;
        text-align: center;
        word-break: break-word;
    }

    .word-tile:hover:not(:disabled) {
        background-color: #6a6a6c;
    }

    .word-tile.selected {
        background-color: #5a5a5c;
        border: 3px solid #ffffff;
        transform: scale(0.98);
    }

    .word-tile:disabled {
        cursor: default;
    }

    /* Shake animation for wrong guesses */
    .word-tile.shaking {
        animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    /* Retries */
    .retries-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 1.5rem 0;
    }

    .retries-label {
        color: #818384;
        font-size: 0.875rem;
    }

    .retries-dots {
        display: flex;
        gap: 0.375rem;
    }

    .retry-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #5a5a5c;
        transition: background-color 0.3s;
    }

    .retry-dot.used {
        background-color: #3a3a3c;
    }

    /* Control Buttons */
    .controls {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    .control-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 24px;
        border: 1px solid #5a5a5c;
        background-color: transparent;
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s, border-color 0.15s, opacity 0.15s;
    }

    .control-btn:hover:not(:disabled) {
        background-color: #3a3a3c;
    }

    .control-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .submit-btn:not(:disabled) {
        background-color: #ffffff;
        color: #121213;
        border-color: #ffffff;
    }

    .submit-btn:hover:not(:disabled) {
        background-color: #e0e0e0;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
    }

    .modal {
        background-color: #1a1a1b;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        border: 1px solid #3a3a3c;
    }

    .modal h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
    }

    .modal p {
        color: #818384;
        margin: 0 0 1.5rem 0;
    }

    .modal-buttons {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
    }

    .modal-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 24px;
        border: 1px solid #5a5a5c;
        background-color: transparent;
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s;
    }

    .modal-btn:hover {
        background-color: #3a3a3c;
    }

    .modal-btn.primary {
        background-color: #ffffff;
        color: #121213;
        border-color: #ffffff;
    }

    .modal-btn.primary:hover {
        background-color: #e0e0e0;
    }

    /* Share Modal */
    .share-url-container {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .share-url-input {
        flex: 1;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #3a3a3c;
        background-color: #121213;
        color: #ffffff;
        font-size: 0.75rem;
    }

    .copy-btn {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: none;
        background-color: #538d4e;
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s;
        white-space: nowrap;
    }

    .copy-btn:hover {
        background-color: #6aaa5f;
    }
</style>