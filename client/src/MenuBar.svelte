<script>
    let { kidMode = $bindable(false), onNewGame, onShareGame } = $props();
    
    let menuOpen = $state(false);

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    function handleNewGame() {
        menuOpen = false;
        onNewGame?.();
    }

    function handleShareGame() {
        menuOpen = false;
        onShareGame?.();
    }

    function handleKidModeToggle() {
        kidMode = !kidMode;
    }

    // Close menu when clicking outside
    function handleClickOutside(event) {
        if (menuOpen && !event.target.closest('.menu-container')) {
            menuOpen = false;
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<nav class="menu-bar">
    <div class="left-section">
        <label class="kid-mode-toggle">
            <input 
                type="checkbox" 
                checked={kidMode}
                onchange={handleKidModeToggle}
            />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Kid Mode</span>
        </label>
    </div>
    
    <div class="center-section">
        <h1 class="title">Connections</h1>
    </div>
    
    <div class="right-section">
        <div class="menu-container">
            <button class="menu-button" onclick={toggleMenu} aria-label="Open menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                </svg>
            </button>
            
            {#if menuOpen}
                <div class="dropdown-menu">
                    <button class="menu-item" onclick={handleNewGame}>
                        New Game
                    </button>
                    <button class="menu-item" onclick={handleShareGame}>
                        Share Game
                    </button>
                </div>
            {/if}
        </div>
    </div>
</nav>

<style>
    .menu-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #3a3a3c;
        background-color: #121213;
    }

    .left-section,
    .right-section {
        flex: 1;
        display: flex;
    }

    .left-section {
        justify-content: flex-start;
    }

    .right-section {
        justify-content: flex-end;
    }

    .center-section {
        flex: 0 0 auto;
    }

    .title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    /* Kid Mode Toggle Switch */
    .kid-mode-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        user-select: none;
    }

    .kid-mode-toggle input {
        display: none;
    }

    .toggle-slider {
        position: relative;
        width: 44px;
        height: 24px;
        background-color: #3a3a3c;
        border-radius: 12px;
        transition: background-color 0.2s;
    }

    .toggle-slider::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background-color: #ffffff;
        border-radius: 50%;
        transition: transform 0.2s;
    }

    .kid-mode-toggle input:checked + .toggle-slider {
        background-color: #538d4e;
    }

    .kid-mode-toggle input:checked + .toggle-slider::after {
        transform: translateX(20px);
    }

    .toggle-label {
        color: #818384;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Menu Button and Dropdown */
    .menu-container {
        position: relative;
    }

    .menu-button {
        background: none;
        border: none;
        color: #818384;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s, background-color 0.2s;
    }

    .menu-button:hover {
        color: #ffffff;
        background-color: #3a3a3c;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background-color: #1a1a1b;
        border: 1px solid #3a3a3c;
        border-radius: 8px;
        overflow: hidden;
        min-width: 150px;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .menu-item {
        display: block;
        width: 100%;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        color: #ffffff;
        font-size: 0.875rem;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .menu-item:hover {
        background-color: #3a3a3c;
    }

    .menu-item + .menu-item {
        border-top: 1px solid #3a3a3c;
    }
</style>
