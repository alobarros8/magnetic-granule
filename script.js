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

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;

const gameBoard = document.getElementById('game-board');

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

function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    resetBoardState();
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');

        resetBoardState();
    }, 1000);
}

function resetBoardState() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function resetBoard() {
    resetBoardState();
    createBoard();
}

// Initialize game
document.addEventListener('DOMContentLoaded', createBoard);
