/**
 * Configuraciones de niveles de dificultad
 * @type {Object}
 */
const DIFFICULTY_LEVELS = {
    easy: {
        pairs: 4,
        icons: ['fa-diamond', 'fa-paper-plane', 'fa-anchor', 'fa-bolt']
    },
    medium: {
        pairs: 6,
        icons: ['fa-diamond', 'fa-paper-plane', 'fa-anchor', 'fa-bolt', 'fa-cube', 'fa-leaf']
    },
    hard: {
        pairs: 8,
        icons: ['fa-diamond', 'fa-paper-plane', 'fa-anchor', 'fa-bolt', 'fa-cube', 'fa-leaf', 'fa-bicycle', 'fa-bomb']
    },
    expert: {
        pairs: 10,
        icons: ['fa-diamond', 'fa-paper-plane', 'fa-anchor', 'fa-bolt', 'fa-cube', 'fa-leaf', 'fa-bicycle', 'fa-bomb', 'fa-heart', 'fa-star']
    }
};

/**
 * Variables de estado del juego
 */
let currentDifficulty = 'easy';
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

const gameBoard = document.getElementById('game-board');

/**
 * Inicializa el juego cuando se carga el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeDifficultyButtons();
    loadHighScore();
    createBoard();
});

/**
 * Inicializa los botones de dificultad
 */
function initializeDifficultyButtons() {
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            buttons.forEach(b => b.classList.remove('active'));
            // Agregar active al seleccionado
            btn.classList.add('active');
            // Cambiar dificultad
            currentDifficulty = btn.dataset.level;
            // Reiniciar juego
            resetBoard();
        });
    });
}

/**
 * Mezcla aleatoriamente los elementos de un array (Fisher-Yates)
 * @param {any[]} array - El array a mezclar
 * @returns {any[]} El array mezclado
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
 * Crea el tablero de juego basado en el nivel de dificultad actual
 */
function createBoard() {
    gameBoard.innerHTML = '';

    // Obtener configuración del nivel actual
    const config = DIFFICULTY_LEVELS[currentDifficulty];

    // Crear pares de cartas
    cards = [];
    config.icons.forEach(icon => {
        cards.push(icon, icon);
    });

    // Mezclar cartas
    const shuffledCards = shuffle([...cards]);

    // Aplicar clase de dificultad al tablero
    gameBoard.className = `tablero-de-juego ${currentDifficulty}`;

    // Crear elementos HTML para cada carta
    shuffledCards.forEach(iconClass => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('carta');
        cardElement.dataset.icon = iconClass;

        const frontFace = document.createElement('div');
        frontFace.classList.add('cara-frontal');
        const icon = document.createElement('i');
        icon.classList.add('fa', iconClass);
        frontFace.appendChild(icon);

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
 * Maneja el evento de clic en una carta
 */
function flipCard() {
    // Iniciar cronómetro en el primer movimiento
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
    }

    if (lockBoard) return;
    if (this === firstCard) return;
    if (this.classList.contains('matched')) return;

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
 * Comprueba si las dos cartas volteadas coinciden
 */
function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    if (isMatch) {
        disableCards();
        matchedPairs++;
        updateScore(100); // Puntos por acierto
        checkVictory();
    } else {
        loseLife();
        unflipCards();
    }
}

/**
 * Deshabilita las cartas coincidentes
 */
function disableCards() {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    resetBoardState();
}

/**
 * Voltea las cartas de nuevo si no coinciden
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
 * Resta una vida al jugador
 */
function loseLife() {
    lives--;
    updateLivesUI();
    updateScore(-20); // Penalización por error

    if (lives === 0) {
        endGame(false);
    }
}

/**
 * Actualiza la visualización de los corazones de vida
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
 * Actualiza el contador de movimientos en la UI
 */
function updateMovesUI() {
    document.getElementById('moves').textContent = moves;
}

/**
 * Actualiza la puntuación
 * @param {number} points - Puntos a añadir/restar
 */
function updateScore(points) {
    score = Math.max(0, score + points);
    document.getElementById('score').textContent = score;
}

/**
 * Inicia el cronómetro
 */
function startTimer() {
    timerSeconds = 0;
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
        // Penalización leve por tiempo cada 10 segundos
        if (timerSeconds % 10 === 0) {
            updateScore(-1);
        }
    }, 1000);
}

/**
 * Detiene el cronómetro
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Actualiza la visualización del cronómetro
 */
function updateTimerUI() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timer').textContent = formatted;
}

/**
 * Formatea el tiempo en formato MM:SS
 * @param {number} seconds - Segundos totales
 * @returns {string} Tiempo formateado
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Resetea las variables de estado del tablero
 */
function resetBoardState() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

/**
 * Comprueba si el jugador ha ganado
 */
function checkVictory() {
    const totalPairs = DIFFICULTY_LEVELS[currentDifficulty].pairs;
    if (matchedPairs === totalPairs) {
        endGame(true);
    }
}

/**
 * Finaliza el juego
 * @param {boolean} victory - true si ganó, false si perdió
 */
function endGame(victory) {
    stopTimer();
    lockBoard = true;
    gameStarted = false;

    if (victory) {
        // Bonus por completar
        let timeBonus = Math.max(0, 300 - timerSeconds);
        updateScore(timeBonus);

        setTimeout(() => {
            showVictoryModal();
        }, 500);
    } else {
        setTimeout(() => {
            alert('¡Juego terminado! Te has quedado sin vidas.');
            resetBoard();
        }, 500);
    }
}

/**
 * Muestra el modal de victoria
 */
function showVictoryModal() {
    // Actualizar estadísticas del modal
    document.getElementById('finalTime').textContent = formatTime(timerSeconds);
    document.getElementById('finalMoves').textContent = moves;
    document.getElementById('finalScore').textContent = score;

    // Verificar si es nuevo récord
    const currentHighScore = getHighScore();
    const newRecordDiv = document.getElementById('newRecord');

    if (score > currentHighScore) {
        saveHighScore(score);
        loadHighScore();
        newRecordDiv.style.display = 'block';
    } else {
        newRecordDiv.style.display = 'none';
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('victoryModal'));
    modal.show();
}

/**
 * Obtiene el high score del localStorage
 * @returns {number} El high score actual
 */
function getHighScore() {
    const key = `highscore_${currentDifficulty}`;
    return parseInt(localStorage.getItem(key)) || 0;
}

/**
 * Guarda el high score en localStorage
 * @param {number} newScore - Nueva puntuación a guardar
 */
function saveHighScore(newScore) {
    const key = `highscore_${currentDifficulty}`;
    const currentHighScore = getHighScore();
    if (newScore > currentHighScore) {
        localStorage.setItem(key, newScore.toString());
    }
}

/**
 * Carga y muestra el high score
 */
function loadHighScore() {
    const highScore = getHighScore();
    document.getElementById('highscore').textContent = highScore;
}

/**
 * Reinicia el juego completo
 */
function resetBoard() {
    // Detener cronómetro si está corriendo
    stopTimer();

    // Resetear variables
    lives = 3;
    moves = 0;
    matchedPairs = 0;
    score = 0;
    timerSeconds = 0;
    gameStarted = false;

    // Actualizar UI
    updateLivesUI();
    updateMovesUI();
    updateScore(0);
    updateTimerUI();
    loadHighScore();
    resetBoardState();

    // Recrear tablero
    createBoard();
}
