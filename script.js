// Game State
const gameState = {
    mode: null,
    level: 1,
    score: 0,
    timer: null,
    timeLeft: 60,
    isPlaying: false,
    isPaused: false,
    currentProblem: null,
    operations: {
        basic: ['+', '-', '*', '/'],
        advanced: ['^', '√', 'log', 'sin']
    }
};

// Game Initialization
function startGame(mode) {
    gameState.mode = mode;
    gameState.level = 1;
    gameState.score = 0;
    gameState.timeLeft = mode === 'speed' ? 30 : 60;
    gameState.isPlaying = true;
    gameState.isPaused = false;

    // Update UI
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('currentScore').textContent = gameState.score;

    // Start timer and generate first problem
    startTimer();
    generateProblem();

    // Focus on input
    document.getElementById('answerInput').focus();
}

// Timer Functions
function startTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    gameState.timer = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.timeLeft--;
            updateTimerDisplay();

            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('gameTimer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Problem Generation
function generateProblem() {
    let num1, num2, operation, answer;

    if (gameState.mode === 'basic') {
        num1 = Math.floor(Math.random() * (gameState.level * 10)) + 1;
        num2 = Math.floor(Math.random() * (gameState.level * 10)) + 1;
        operation = gameState.operations.basic[Math.floor(Math.random() * gameState.operations.basic.length)];

        switch(operation) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                [num1, num2] = num1 < num2 ? [num2, num1] : [num1, num2];
                answer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                num2 = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                answer = num1 * num2;
                break;
            case '/':
                num2 = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                answer = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                num1 = num2 * answer;
                break;
        }
    } else if (gameState.mode === 'advanced') {
        switch(Math.floor(Math.random() * 4)) {
            case 0: // Square
                num1 = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                answer = num1 * num1;
                operation = '^2';
                num2 = '';
                break;
            case 1: // Square root
                answer = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                num1 = answer * answer;
                operation = '√';
                num2 = '';
                break;
            case 2: // Power of 2
                num1 = 2;
                num2 = Math.floor(Math.random() * (gameState.level * 2)) + 1;
                answer = Math.pow(num1, num2);
                operation = '^';
                break;
            case 3: // Simple equation
                num1 = Math.floor(Math.random() * (gameState.level * 10)) + 1;
                num2 = Math.floor(Math.random() * (gameState.level * 5)) + 1;
                answer = num1 + num2;
                operation = '+';
                break;
        }
    }

    gameState.currentProblem = {
        num1: num1,
        num2: num2,
        operation: operation,
        answer: answer
    };

    displayProblem();
}

function displayProblem() {
    let problemText;
    const { num1, num2, operation } = gameState.currentProblem;

    switch(operation) {
        case '√':
            problemText = `√${num1}`;
            break;
        case '^2':
            problemText = `${num1}²`;
            break;
        case '^':
            problemText = `${num1}^${num2}`;
            break;
        default:
            problemText = `${num1} ${operation} ${num2}`;
    }

    document.getElementById('problemDisplay').textContent = problemText;
    document.getElementById('answerInput').value = '';
}

// Answer Checking
function checkAnswer() {
    const userAnswer = parseFloat(document.getElementById('answerInput').value);
    
    if (isNaN(userAnswer)) {
        showToast('Please enter a valid number', 'error');
        return;
    }

    if (Math.abs(userAnswer - gameState.currentProblem.answer) < 0.1) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
}

function handleCorrectAnswer() {
    // Calculate score based on level and time
    const baseScore = gameState.mode === 'speed' ? 100 : 50;
    const timeBonus = Math.floor(gameState.timeLeft / 10);
    const levelBonus = gameState.level * 10;
    const pointsEarned = baseScore + timeBonus + levelBonus;

    gameState.score += pointsEarned;
    document.getElementById('currentScore').textContent = gameState.score;

    // Show success message
    showToast(`Correct! +${pointsEarned} points`, 'success');

    // Level up if enough points
    if (gameState.score >= gameState.level * 500) {
        levelUp();
    }

    // Add time bonus for speed mode
    if (gameState.mode === 'speed') {
        gameState.timeLeft += 2;
        updateTimerDisplay();
    }

    // Generate new problem
    generateProblem();
}

function handleWrongAnswer() {
    showToast('Incorrect! Try again', 'error');
    
    if (gameState.mode === 'speed') {
        gameState.timeLeft -= 5;
        updateTimerDisplay();
    }
}

function levelUp() {
    gameState.level++;
    document.getElementById('currentLevel').textContent = gameState.level;
    showToast(`Level Up! Now at Level ${gameState.level}`, 'success');
    
    if (gameState.mode === 'speed') {
        gameState.timeLeft += 10;
        updateTimerDisplay();
    }
}

// Game Control Functions
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    const pauseBtn = document.querySelector('.btn-pause');
    pauseBtn.innerHTML = gameState.isPaused ? 
        '<i class="fas fa-play"></i> Resume' : 
        '<i class="fas fa-pause"></i> Pause';
    
    if (gameState.isPaused) {
        showToast('Game Paused', 'info');
    } else {
        showToast('Game Resumed', 'info');
    }
}

function restartGame() {
    startGame(gameState.mode);
}

function endGame() {
    clearInterval(gameState.timer);
    gameState.isPlaying = false;

    // Update final score in modal
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.level;

    // Show game over modal
    const gameOverModal = new bootstrap.Modal(document.getElementById('gameOverModal'));
    gameOverModal.show();
}

// Utility Functions
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;

    // Add showing class
    toast.classList.add('showing');

    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle enter key in answer input
    document.getElementById('answerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !gameState.isPaused) {
            checkAnswer();
        }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (gameState.isPlaying) {
            if (e.key === 'p' || e.key === 'P') {
                togglePause();
            }
        }
    });
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.isPlaying && !gameState.isPaused) {
        togglePause();
    }
});

// Prevent form submission
document.addEventListener('submit', (e) => e.preventDefault());