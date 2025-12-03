/**
 * Array de nombres de clases de iconos de Font Awesome.
 * Se duplican para formar pares de cartas.
 * @type {string[]}
 */
const cards = [
    'fa-diamond', 'fa-diamond',
    'fa-paper-plane', 'fa-paper-plane',
    'fa-anchor', 'fa-anchor',
    'fa-bolt', 'fa-bolt',
    'fa-cube', 'fa-cube',
    'fa-leaf', 'fa-leaf',
    'fa-bicycle', 'fa-bicycle',
    'fa-bomb', 'fa-bomb'
];

/**
 * Estado del juego: si hay una carta volteada actualmente.
 * @type {boolean}
 */
let hasFlippedCard = false;

/**
 * Estado del juego: si el tablero está bloqueado (no se pueden voltear más cartas).
 * @type {boolean}
 */
let lockBoard = false;

/**
 * Referencia a la primera carta volteada.
 * @type {HTMLElement|null}
 */
let firstCard;

/**
 * Referencia a la segunda carta volteada.
 * @type {HTMLElement|null}
 */
let secondCard;

/**
 * Número de vidas restantes.
 * @type {number}
 */
let lives = 3;

const gameBoard = document.getElementById('game-board');

/**
 * Mezcla aleatoriamente los elementos de un array utilizando el algoritmo Fisher-Yates.
 * @param {any[]} array - El array a mezclar.
 * @returns {any[]} El array mezclado.
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
 * Crea el tablero de juego generando elementos HTML para cada carta.
 * Mezcla las cartas antes de crearlas.
 */
function createBoard() {
    gameBoard.innerHTML = '';
    const shuffledCards = shuffle([...cards]); // Create a copy to shuffle

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
 * Maneja el evento de clic en una carta.
 * Voltea la carta si el tablero no está bloqueado y la carta no es la misma que la primera.
 */
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

/**
 * Comprueba si las dos cartas volteadas coinciden.
 * Si coinciden, las deshabilita. Si no, resta una vida y las voltea de nuevo.
 */
function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    if (isMatch) {
        disableCards();
    } else {
        loseLife();
        unflipCards();
    }
}

/**
 * Deshabilita la interacción con las cartas coincidentes y resetea el estado del tablero.
 */
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    resetBoardState();
}

/**
 * Voltea las cartas de nuevo a su estado original después de un retraso.
 * Se llama cuando las cartas no coinciden.
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
 * Resta una vida al jugador y actualiza la interfaz de usuario.
 * Si las vidas llegan a 0, reinicia el juego.
 */
function loseLife() {
    lives--;
    updateLivesUI();

    if (lives === 0) {
        setTimeout(() => {
            alert('¡Juego terminado! Te has quedado sin vidas.');
            resetBoard();
        }, 500);
    }
}

/**
 * Actualiza la visualización de los corazones de vida.
 * Pone en gris los corazones perdidos.
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
 * Resetea las variables de estado del tablero para el siguiente turno.
 */
function resetBoardState() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

/**
 * Reinicia el juego completo.
 * Restablece las vidas, actualiza la UI y vuelve a crear el tablero.
 */
function resetBoard() {
    lives = 3;
    updateLivesUI();
    resetBoardState();
    createBoard();
}

// Inicializar juego al cargar el DOM
document.addEventListener('DOMContentLoaded', createBoard);
