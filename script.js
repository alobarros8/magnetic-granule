/**
 * ==============================================
 * ICON PACKS CONFIGURATION
 * ==============================================
 */
const ICON_PACKS = {
    default: ['fa-diamond', 'fa-paper-plane', 'fa-anchor', 'fa-bolt', 'fa-cube', 'fa-leaf', 'fa-bicycle', 'fa-bomb', 'fa-heart', 'fa-star'],
    animals: ['fa-dog', 'fa-cat', 'fa-fish', 'fa-crow', 'fa-horse', 'fa-dragon', 'fa-frog', 'fa-hippo', 'fa-otter', 'fa-kiwi-bird'],
    food: ['fa-pizza-slice', 'fa-burger', 'fa-ice-cream', 'fa-cookie', 'fa-bacon', 'fa-cake-candles', 'fa-mug-hot', 'fa-lemon', 'fa-apple-whole', 'fa-carrot'],
    sports: ['fa-basketball', 'fa-football', 'fa-table-tennis-paddle-ball', 'fa-baseball', 'fa-volleyball', 'fa-futbol', 'fa-golf-ball-tee', 'fa-bowling-ball', 'fa-hockey-puck', 'fa-dumbbell'],
    emojis: ['😀', '🎉', '⭐', '🔥', '💎', '🌈', '🎨', '🎵', '⚡', '🌟']
};

/**
 * ==============================================
 * DIFFICULTY LEVELS CONFIGURATION
 * ==============================================
 */
const DIFFICULTY_LEVELS = {
    easy: { pairs: 4 },
    medium: { pairs: 6 },
    hard: { pairs: 8 },
    expert: { pairs: 10 }
};

/**
 * ==============================================
 * SOUND MANAGER
 * ==============================================
 */
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.muted = localStorage.getItem('soundMuted') === 'true';
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSound(type) {
        if (this.muted || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        switch (type) {
            case 'flip':
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'match':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
            case 'fail':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'victory':
                // Victory is a short melody
                const frequencies = [523, 659, 784, 1047];
                frequencies.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime + i * 0.2);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + (i + 1) * 0.2);
                    osc.start(this.audioContext.currentTime + i * 0.2);
                    osc.stop(this.audioContext.currentTime + (i + 1) * 0.2);
                });
                return; // Early return as we handle multiple notes
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('soundMuted', this.muted);
        return this.muted;
    }
}

/**
 * ==============================================
 * GAME STATE VARIABLES
 * ==============================================
 */
let currentDifficulty = 'easy';
let currentIconPack = 'default';
let currentTheme = 'light';
let cards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard;
let secondCard;
let lives = 3;
let moves = 0;
let matchedPairs = 0;
let score = 0;
let timerSeconds = 0;
let timerInterval = null;
let gameStarted = false;

// Multiplayer
let isMultiplayer = false;
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;

// Managers
const soundManager = new SoundManager();
const gameBoard = document.getElementById('game-board');

/**
 * ==============================================
 * INITIALIZATION
 * ==============================================
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeDifficultyButtons();
    initializeThemeButtons();
    initializeIconPackButtons();
    initializeModeButtons();
    initializeSoundToggle();
    loadPreferences();
    createBoard();
});

/**
 * Initialize difficulty selector buttons
 */
function initializeDifficultyButtons() {
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.level;
            resetBoard();
        });
    });
}

/**
 * Initialize theme selector buttons
 */
function initializeThemeButtons() {
    const buttons = document.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTheme = btn.dataset.theme;
            applyTheme(currentTheme);
            localStorage.setItem('preferredTheme', currentTheme);
        });
    });
}

/**
 * Initialize icon pack selector buttons
 */
function initializeIconPackButtons() {
    const buttons = document.querySelectorAll('.iconpack-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentIconPack = btn.dataset.pack;
            localStorage.setItem('preferredIconPack', currentIconPack);
            resetBoard();
        });
    });
}

/**
 * Initialize mode buttons (single/multiplayer)
 */
function initializeModeButtons() {
    const buttons = document.querySelectorAll('.mode-btn');
    const multiplayerPanel = document.getElementById('multiplayerPanel');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            isMultiplayer = btn.dataset.mode === 'multiplayer';

            if (isMultiplayer) {
                multiplayerPanel.style.display = 'block';
            } else {
                multiplayerPanel.style.display = 'none';
            }

            resetBoard();
        });
    });
}

/**
 * Initialize sound toggle button
 */
function initializeSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    if (soundManager.muted) {
        soundToggle.classList.add('muted');
    }

    soundToggle.addEventListener('click', () => {
        const muted = soundManager.toggleMute();
        if (muted) {
            soundToggle.classList.add('muted');
        } else {
            soundToggle.classList.remove('muted');
        }
    });
}

/**
 * Load saved preferences from localStorage
 */
function loadPreferences() {
    const savedTheme = localStorage.getItem('preferredTheme');
    const savedIconPack = localStorage.getItem('preferredIconPack');

    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(savedTheme);
        document.querySelector(`[data-theme="${savedTheme}"]`)?.classList.add('active');
    }

    if (savedIconPack) {
        currentIconPack = savedIconPack;
        document.querySelector(`[data-pack="${savedIconPack}"]`)?.classList.add('active');
    }
}

/**
 * Apply theme to body
 */
function applyTheme(theme) {
    document.body.className = `bg-light d-flex align-items-center justify-content-center min-vh-100 py-4 theme-${theme}`;
}

/**
 * ==============================================
 * GAME LOGIC
 * ==============================================
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Create game board
 */
function createBoard() {
    gameBoard.innerHTML = '';

    const config = DIFFICULTY_LEVELS[currentDifficulty];
    const iconPack = ICON_PACKS[currentIconPack];
    const iconsToUse = iconPack.slice(0, config.pairs);

    cards = [];
    iconsToUse.forEach(icon => {
        cards.push(icon, icon);
    });

    const shuffledCards = shuffle([...cards]);
    gameBoard.className = `tablero-de-juego ${currentDifficulty}`;

    shuffledCards.forEach(iconClass => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('carta');
        cardElement.dataset.icon = iconClass;

        const frontFace = document.createElement('div');
        frontFace.classList.add('cara-frontal');

        // Handle emoji flags differently
        if (iconClass.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u)) {
            frontFace.textContent = iconClass;
        } else {
            const icon = document.createElement('i');
            icon.classList.add('fa', iconClass);
            frontFace.appendChild(icon);
        }

        const backFace = document.createElement('div');
        backFace.classList.add('cara-trasera');
        const questionIcon = document.createElement('i');
        questionIcon.classList.add('fa', 'fa-question');
        backFace.appendChild(questionIcon);

        cardElement.appendChild(frontFace);
        cardElement.appendChild(backFace);

        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });
}

/**
 * Handle card flip
 */
function flipCard() {
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
    }

    if (lockBoard) return;
    if (this === firstCard) return;
    if (this.classList.contains('matched')) return;

    soundManager.playSound('flip');
    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++;
    updateMovesUI();
    checkForMatch();
}

/**
 * Check if cards match
 */
function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    if (isMatch) {
        disableCards();
        matchedPairs++;
        soundManager.playSound('match');

        if (isMultiplayer) {
            if (currentPlayer === 1) {
                player1Score += 100;
            } else {
                player2Score += 100;
            }
            updateMultiplayerUI();
        } else {
            updateScore(100);
        }

        // Confetti for match
        confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.6 }
        });

        checkVictory();
    } else {
        soundManager.playSound('fail');

        if (isMultiplayer) {
            switchPlayer();
        } else {
            loseLife();
        }

        unflipCards();
    }
}

/**
 * Disable matched cards
 */
function disableCards() {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    resetBoardState();
}

/**
 * Unflip cards that don't match
 */
function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');

        resetBoardState();
    }, 1000);
}

/**
 * Reset board state for next turn
 */
function resetBoardState() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

/**
 * ==============================================
 * MULTIPLAYER LOGIC
 * ==============================================
 */

/**
 * Switch to other player
 */
function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateMultiplayerUI();
}

/**
 * Update multiplayer UI
 */
function updateMultiplayerUI() {
    document.getElementById('player1Score').textContent = `${player1Score} pts`;
    document.getElementById('player2Score').textContent = `${player2Score} pts`;

    const player1Card = document.getElementById('player1Card');
    const player2Card = document.getElementById('player2Card');

    if (currentPlayer === 1) {
        player1Card.classList.add('active');
        player2Card.classList.remove('active');
        player1Card.querySelector('.turn-indicator').style.display = 'block';
        if (player2Card.querySelector('.turn-indicator')) {
            player2Card.querySelector('.turn-indicator').style.display = 'none';
        }
    } else {
        player2Card.classList.add('active');
        player1Card.classList.remove('active');
        player1Card.querySelector('.turn-indicator').style.display = 'none';
        if (!player2Card.querySelector('.turn-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'turn-indicator';
            indicator.textContent = 'Tu turno';
            player2Card.querySelector('.player-name').appendChild(indicator);
        }
        player2Card.querySelector('.turn-indicator').style.display = 'block';
    }
}

/**
 * ==============================================
 * SINGLE PLAYER LOGIC
 * ==============================================
 */

/**
 * Lose a life
 */
function loseLife() {
    lives--;
    updateLivesUI();
    updateScore(-20);

    if (lives === 0) {
        endGame(false);
    }
}

/**
 * Update lives UI
 */
function updateLivesUI() {
    for (let i = 1; i <= 3; i++) {
        const heart = document.getElementById(`heart${i}`);
        if (i > lives) {
            heart.classList.add('heart-lost');
            heart.classList.remove('text-danger');
        } else {
            heart.classList.remove('heart-lost');
            heart.classList.add('text-danger');
        }
    }
}

/**
 * ==============================================
 * UI UPDATES
 * ==============================================
 */

/**
 * Update moves counter
 */
function updateMovesUI() {
    document.getElementById('moves').textContent = moves;
}

/**
 * Update score
 */
function updateScore(points) {
    score = Math.max(0, score + points);
    document.getElementById('score').textContent = score;
}

/**
 * ==============================================
 * TIMER
 * ==============================================
 */

/**
 * Start timer
 */
function startTimer() {
    timerSeconds = 0;
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
        if (timerSeconds % 10 === 0 && !isMultiplayer) {
            updateScore(-1);
        }
    }, 1000);
}

/**
 * Stop timer
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Update timer display
 */
function updateTimerUI() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timer').textContent = formatted;
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * ==============================================
 * VICTORY & END GAME
 * ==============================================
 */

/**
 * Check if player won
 */
function checkVictory() {
    const totalPairs = DIFFICULTY_LEVELS[currentDifficulty].pairs;
    if (matchedPairs === totalPairs) {
        endGame(true);
    }
}

/**
 * End game (win or lose)
 */
function endGame(victory) {
    stopTimer();
    lockBoard = true;
    gameStarted = false;

    if (victory) {
        soundManager.playSound('victory');

        if (!isMultiplayer) {
            let timeBonus = Math.max(0, 300 - timerSeconds);
            updateScore(timeBonus);
        }

        setTimeout(() => {
            showVictoryModal();
            // Epic confetti celebration
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }, 500);
    } else {
        setTimeout(() => {
            alert('¡Juego terminado! Te has quedado sin vidas.');
            resetBoard();
        }, 500);
    }
}

/**
 * Show victory modal
 */
function showVictoryModal() {
    document.getElementById('finalTime').textContent = formatTime(timerSeconds);
    document.getElementById('finalMoves').textContent = moves;

    const victoryMessage = document.getElementById('victoryMessage');
    const newRecordDiv = document.getElementById('newRecord');

    if (isMultiplayer) {
        const winner = player1Score > player2Score ? 'Jugador 1' :
            player2Score > player1Score ? 'Jugador 2' : 'Empate';
        victoryMessage.textContent = winner === 'Empate' ? '¡Empate!' : `¡Ganó ${winner}!`;
        document.getElementById('finalScore').textContent = `P1: ${player1Score} | P2: ${player2Score}`;
        newRecordDiv.style.display = 'none';
    } else {
        victoryMessage.textContent = '¡Felicitaciones!';
        document.getElementById('finalScore').textContent = score;

        const currentHighScore = getHighScore();
        if (score > currentHighScore) {
            saveHighScore(score);
            loadHighScore();
            newRecordDiv.style.display = 'block';
        } else {
            newRecordDiv.style.display = 'none';
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('victoryModal'));
    modal.show();
}

/**
 * ==============================================
 * HIGH SCORE MANAGEMENT
 * ==============================================
 */

/**
 * Get high score from localStorage
 */
function getHighScore() {
    const key = `highscore_${currentDifficulty}`;
    return parseInt(localStorage.getItem(key)) || 0;
}

/**
 * Save high score to localStorage
 */
function saveHighScore(newScore) {
    const key = `highscore_${currentDifficulty}`;
    const currentHighScore = getHighScore();
    if (newScore > currentHighScore) {
        localStorage.setItem(key, newScore.toString());
    }
}

/**
 * Load and display high score
 */
function loadHighScore() {
    const highScore = getHighScore();
    document.getElementById('highscore').textContent = highScore;
}

/**
 * ==============================================
 * RESET GAME
 * ==============================================
 */

/**
 * Reset game board
 */
function resetBoard() {
    stopTimer();

    lives = 3;
    moves = 0;
    matchedPairs = 0;
    score = 0;
    timerSeconds = 0;
    gameStarted = false;
    currentPlayer = 1;
    player1Score = 0;
    player2Score = 0;

    updateLivesUI();
    updateMovesUI();
    updateScore(0);
    updateTimerUI();
    loadHighScore();
    resetBoardState();

    if (isMultiplayer) {
        updateMultiplayerUI();
    }

    createBoard();
}
