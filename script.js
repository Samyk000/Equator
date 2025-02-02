// Utility Functions
const UTILS = {
    seedrandom: function(seed) {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    },
    
    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(UTILS.seedrandom(i) * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// Sound Manager with proper error handling and preloading
const SoundManager = {
    sounds: {},
    
    init() {
        const soundFiles = {
            correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
            wrong: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
            levelUp: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
            gameOver: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3'
        };

        Object.entries(soundFiles).forEach(([key, url]) => {
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto';
            this.sounds[key] = audio;
        });
    },

    play(soundName) {
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName].currentTime = 0;
                const playPromise = this.sounds[soundName].play();
                if (playPromise) {
                    playPromise.catch(error => {
                        console.log("Sound play failed, but continuing game");
                    });
                }
            }
        } catch (error) {
            console.log("Sound play error handled, continuing game");
        }
    }
};

// Achievement System
const AchievementSystem = {
    achievements: [
        {
            id: 'firstWin',
            title: 'First Victory',
            description: 'Solve your first problem correctly',
            condition: (state) => state.correctAnswers === 1
        },
        {
            id: 'perfectTen',
            title: 'Perfect Ten',
            description: 'Achieve a 10x combo',
            condition: (state) => state.combo >= 10
        },
        {
            id: 'speedster',
            title: 'Speedster',
            description: 'Score 1000 points in speed mode',
            condition: (state) => state.mode === 'speed' && state.score >= 1000
        },
        {
            id: 'mathWhiz',
            title: 'Math Whiz',
            description: 'Score 5000 points in a single game',
            condition: (state) => state.score >= 5000
        },
        {
            id: 'noHints',
            title: 'Pure Genius',
            description: 'Score 2000 points without using hints',
            condition: (state) => state.hintsLeft === CONFIG.maxHints && state.score >= 2000
        }
    ],

    check(gameState) {
        this.achievements.forEach(achievement => {
            if (!gameState.achievements.has(achievement.id) && achievement.condition(gameState)) {
                this.award(achievement, gameState);
            }
        });
    },

    award(achievement, gameState) {
        gameState.achievements.add(achievement.id);
        Game.showToast(`Achievement Unlocked: ${achievement.title}!`, 'achievement');
    }
};


// Game Configuration
const CONFIG = {
    modes: {
        basic: {
            operations: ['+', '-', '*'],
            maxNumber: 20,
            timeLimit: 60,
            pointsPerQuestion: 100,
            levelThreshold: 500
        },
        advanced: {
            operations: ['+', '-', '*', '/', '^', '√'],
            maxNumber: 50,
            timeLimit: 90,
            pointsPerQuestion: 200,
            levelThreshold: 1000
        },
        speed: {
            operations: ['+', '-', '*'],
            maxNumber: 30,
            timeLimit: 30,
            pointsPerQuestion: 150,
            levelThreshold: 750
        },
        practice: {
            operations: ['+', '-', '*', '/'],
            maxNumber: 20,
            timeLimit: Infinity,
            pointsPerQuestion: 50,
            levelThreshold: 300
        }
    },
    comboMultiplier: 0.1,
    maxCombo: 10,
    hintPenalty: 0.5,
    maxHints: 3
};

// Game State
const gameState = {
    mode: null,
    level: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hintsLeft: CONFIG.maxHints,
    correctAnswers: 0,
    totalAttempts: 0,
    timeLeft: 0,
    timer: null,
    isPlaying: false,
    isPaused: false,
    isDaily: false,
    currentProblem: null,
    achievements: new Set(),
    statistics: {
        topicsPerformance: {},
        recentScores: [],
        averageAccuracy: 0,
        bestScores: {
            basic: 0,
            advanced: 0,
            speed: 0,
            practice: 0
        }
    }
};

// Theme Manager
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        }
    },

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
};

// Problem Generator
class ProblemGenerator {
    static generate(mode) {
        const config = CONFIG.modes[mode];
        const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
        let problem, answer, num1, num2;

        switch(operation) {
            case '+':
                num1 = Math.floor(Math.random() * config.maxNumber) + 1;
                num2 = Math.floor(Math.random() * config.maxNumber) + 1;
                answer = num1 + num2;
                problem = `${num1} + ${num2}`;
                break;

            case '-':
                num1 = Math.floor(Math.random() * config.maxNumber) + 1;
                num2 = Math.floor(Math.random() * num1) + 1;
                answer = num1 - num2;
                problem = `${num1} - ${num2}`;
                break;

            case '*':
                num1 = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                num2 = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                answer = num1 * num2;
                problem = `${num1} × ${num2}`;
                break;

            case '/':
                num2 = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                answer = Math.floor(Math.random() * 10) + 1;
                num1 = num2 * answer;
                problem = `${num1} ÷ ${num2}`;
                break;

            case '^':
                num1 = Math.floor(Math.random() * 10) + 1;
                num2 = Math.floor(Math.random() * 3) + 1;
                answer = Math.pow(num1, num2);
                problem = `${num1}<sup>${num2}</sup>`;
                break;

            case '√':
                answer = Math.floor(Math.random() * 10) + 1;
                num1 = answer * answer;
                problem = `√${num1}`;
                break;
        }

        return {
            problem,
            answer,
            operation,
            num1,
            num2
        };
    }

    static getHint(problem) {
        switch(problem.operation) {
            case '+':
                return `Try breaking ${problem.num1} into smaller parts: ${Math.floor(problem.num1/2)} + ${Math.ceil(problem.num1/2)} + ${problem.num2}`;
            case '-':
                return `Think: ${problem.num2} plus what number equals ${problem.num1}?`;
            case '*':
                return `Break it down: ${problem.num1} × ${problem.num2} = ${problem.num1} added ${problem.num2} times`;
            case '/':
                return `How many groups of ${problem.num2} make ${problem.num1}?`;
            case '^':
                return `Multiply ${problem.num1} by itself ${problem.num2} times`;
            case '√':
                return `What number times itself equals ${problem.num1}?`;
            default:
                return `The answer is between ${Math.floor(problem.answer - 5)} and ${Math.ceil(problem.answer + 5)}`;
        }
    }
}

// Game Class
class Game {
    static init() {
        this.bindEventListeners();
        ThemeManager.init();
        SoundManager.init();
        this.loadSavedData();
        this.showInitialState();
    }

    static bindEventListeners() {
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.checkAnswer();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (gameState.isPlaying) {
                switch(e.key.toLowerCase()) {
                    case 'h': this.showHint(); break;
                    case 'p': this.togglePause(); break;
                    case 'r': this.restartGame(); break;
                }
            }
        });
    }

    static showInitialState() {
        const modeSelection = document.getElementById('modeSelection');
        const gameArea = document.getElementById('gameArea');
        
        if (modeSelection) modeSelection.style.display = 'block';
        if (gameArea) gameArea.style.display = 'none';
        
        if (document.getElementById('performanceChart')) {
            this.updateCharts();
        }
    }

    static startGame(mode) {
        if (!CONFIG.modes[mode]) return;

        gameState.mode = mode;
        gameState.isPlaying = true;
        gameState.isPaused = false;
        gameState.score = 0;
        gameState.level = 1;
        gameState.combo = 0;
        gameState.hintsLeft = CONFIG.maxHints;
        gameState.timeLeft = CONFIG.modes[mode].timeLimit;
        gameState.correctAnswers = 0;
        gameState.totalAttempts = 0;

        const modeSelection = document.getElementById('modeSelection');
        const gameArea = document.getElementById('gameArea');
        
        if (modeSelection) modeSelection.style.display = 'none';
        if (gameArea) {
            gameArea.style.display = 'block';
            anime({
                targets: gameArea,
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 800,
                easing: 'easeOutCubic'
            });
        }

        this.generateNewProblem();
        this.startTimer();
        this.updateUI();
    }

    static startDailyChallenge() {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const modes = ['basic', 'advanced', 'speed'];
        const randomMode = modes[Math.floor(UTILS.seedrandom(seed) * modes.length)];
        
        gameState.isDaily = true;
        this.startGame(randomMode);
    }

    static generateNewProblem() {
        gameState.currentProblem = ProblemGenerator.generate(gameState.mode);
        
        const problemDisplay = document.getElementById('problemDisplay');
        if (problemDisplay) {
            anime({
                targets: problemDisplay,
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 500,
                easing: 'easeOutCubic'
            });
            problemDisplay.innerHTML = gameState.currentProblem.problem;
        }

        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }
    }

    static checkAnswer() {
        if (!gameState.isPlaying || gameState.isPaused) return;

        const answerInput = document.getElementById('answerInput');
        if (!answerInput) return;

        const userAnswer = parseFloat(answerInput.value);
        if (isNaN(userAnswer)) {
            this.showToast('Please enter a valid number', 'error');
            return;
        }

        gameState.totalAttempts++;
        const isCorrect = Math.abs(userAnswer - gameState.currentProblem.answer) < 0.1;

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }

        this.updateStatistics(isCorrect);
        AchievementSystem.check(gameState); // Fixed achievement checking
        this.updateUI();
    }

    static handleCorrectAnswer() {
        SoundManager.play('correct');
        gameState.combo++;
        gameState.correctAnswers++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);

        const basePoints = CONFIG.modes[gameState.mode].pointsPerQuestion;
        const comboMultiplier = 1 + (Math.min(gameState.combo, CONFIG.maxCombo) * CONFIG.comboMultiplier);
        const points = Math.round(basePoints * comboMultiplier);

        gameState.score += points;
        this.showComboIndicator(points);
        this.checkLevelUp();
        this.generateNewProblem();
    }

    static handleWrongAnswer() {
        SoundManager.play('wrong');
        gameState.combo = 0;
        
        if (gameState.mode === 'speed') {
            gameState.timeLeft = Math.max(0, gameState.timeLeft - 5);
        }

        this.showToast('Incorrect! Try again', 'error');
        
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            anime({
                targets: answerInput,
                translateX: [
                    { value: -10, duration: 100 },
                    { value: 10, duration: 100 },
                    { value: -10, duration: 100 },
                    { value: 10, duration: 100 },
                    { value: 0, duration: 100 }
                ],
                easing: 'easeInOutQuad'
            });
        }
    }

    static showHint() {
        if (gameState.hintsLeft <= 0) {
            this.showToast('No hints remaining!', 'error');
            return;
        }

        gameState.hintsLeft--;
        const hint = ProblemGenerator.getHint(gameState.currentProblem);
        const hintBadge = document.getElementById('hintBadge');
        
        if (hintBadge) {
            hintBadge.textContent = hint;
            anime({
                targets: hintBadge,
                opacity: [0, 1],
                translateY: [-20, 0],
                duration: 500,
                easing: 'easeOutCubic'
            });

            setTimeout(() => {
                anime({
                    targets: hintBadge,
                    opacity: 0,
                    duration: 500,
                    easing: 'easeOutCubic'
                });
            }, 3000);
        }

        const hintCount = document.getElementById('hintCount');
        if (hintCount) {
            hintCount.textContent = gameState.hintsLeft;
        }
    }

    static togglePause() {
        gameState.isPaused = !gameState.isPaused;
        
        const pauseBtn = document.querySelector('.btn-pause');
        if (pauseBtn) {
            pauseBtn.innerHTML = gameState.isPaused ? 
                '<i class="fas fa-play"></i> Resume' : 
                '<i class="fas fa-pause"></i> Pause';
        }
        
        this.showToast(gameState.isPaused ? 'Game Paused' : 'Game Resumed', 'info');

        const gameArea = document.getElementById('gameArea');
        if (gameArea) {
            anime({
                targets: gameArea,
                filter: gameState.isPaused ? ['blur(0px)', 'blur(3px)'] : ['blur(3px)', 'blur(0px)'],
                duration: 300,
                easing: 'easeOutCubic'
            });
        }
    }

    static startTimer() {
        if (gameState.timer) clearInterval(gameState.timer);
        
        if (gameState.mode === 'practice') return;

        gameState.timer = setInterval(() => {
            if (!gameState.isPaused && gameState.isPlaying) {
                gameState.timeLeft--;
                if (gameState.timeLeft <= 0) {
                    this.endGame();
                }
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    static updateTimerDisplay() {
        const timerElement = document.getElementById('gameTimer');
        if (!timerElement) return;

        const formattedTime = UTILS.formatTime(gameState.timeLeft);
        timerElement.textContent = formattedTime;

        if (gameState.timeLeft <= 10) {
            timerElement.classList.add('urgent');
        } else {
            timerElement.classList.remove('urgent');
        }
    }

    static checkLevelUp() {
        const threshold = CONFIG.modes[gameState.mode].levelThreshold;
        if (gameState.score >= threshold * gameState.level) {
            gameState.level++;
            SoundManager.play('levelUp');
            this.showToast(`Level Up! You're now level ${gameState.level}`, 'success');
            
            const levelElement = document.getElementById('currentLevel');
            if (levelElement) {
                anime({
                    targets: levelElement,
                    scale: [1, 1.5, 1],
                    duration: 1000,
                    easing: 'easeOutElastic(1, .5)'
                });
            }
        }
    }

    static endGame() {
        gameState.isPlaying = false;
        if (gameState.timer) clearInterval(gameState.timer);
        SoundManager.play('gameOver');

        gameState.statistics.recentScores.push(gameState.score);
        if (gameState.statistics.recentScores.length > 10) {
            gameState.statistics.recentScores.shift();
        }

        if (gameState.score > gameState.statistics.bestScores[gameState.mode]) {
            gameState.statistics.bestScores[gameState.mode] = gameState.score;
        }

        this.saveGameData();
        this.showGameOverModal();
    }

    static showGameOverModal() {
        const finalScore = document.getElementById('finalScore');
        const finalLevel = document.getElementById('finalLevel');
        const correctAnswers = document.getElementById('correctAnswers');
        const accuracy = document.getElementById('accuracy');
        const bestCombo = document.getElementById('bestCombo');

        if (finalScore) finalScore.textContent = gameState.score;
        if (finalLevel) finalLevel.textContent = gameState.level;
        if (correctAnswers) correctAnswers.textContent = gameState.correctAnswers;
        if (accuracy) accuracy.textContent = 
            `${Math.round((gameState.correctAnswers / gameState.totalAttempts) * 100)}%`;
        if (bestCombo) bestCombo.textContent = gameState.maxCombo;

        const modal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        modal.show();

        if (finalScore) {
            anime({
                targets: finalScore,
                innerHTML: [0, gameState.score],
                round: 1,
                duration: 2000,
                easing: 'easeOutExpo'
            });
        }
    }

    static updateUI() {
        if (!gameState.isPlaying) return;

        const elements = {
            currentScore: document.getElementById('currentScore'),
            currentLevel: document.getElementById('currentLevel'),
            comboMultiplier: document.getElementById('comboMultiplier'),
            hintCount: document.getElementById('hintCount'),
            levelProgress: document.getElementById('levelProgress')
        };

        if (elements.currentScore) elements.currentScore.textContent = gameState.score;
        if (elements.currentLevel) elements.currentLevel.textContent = gameState.level;
        if (elements.comboMultiplier) elements.comboMultiplier.textContent = `x${gameState.combo}`;
        if (elements.hintCount) elements.hintCount.textContent = gameState.hintsLeft;

        if (elements.levelProgress) {
            const threshold = CONFIG.modes[gameState.mode].levelThreshold;
            const progress = (gameState.score % threshold) / threshold * 100;
            
            anime({
                targets: elements.levelProgress,
                width: `${progress}%`,
                duration: 300,
                easing: 'easeOutCubic'
            });
        }

        this.updateTimerDisplay();
    }

    static showComboIndicator(points) {
        const indicator = document.createElement('div');
        indicator.className = 'combo-indicator';
        indicator.textContent = `+${points} (${gameState.combo}x Combo!)`;
        document.body.appendChild(indicator);

        anime({
            targets: indicator,
            translateY: [-50, -100],
            opacity: [1, 0],
            duration: 1000,
            easing: 'easeOutCubic',
            complete: () => indicator.remove()
        });
    }

    static showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        anime({
            targets: toast,
            translateX: [100, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutCubic'
        });

        setTimeout(() => {
            anime({
                targets: toast,
                translateX: [0, 100],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeInCubic',
                complete: () => toast.remove()
            });
        }, 3000);
    }

    static updateStatistics(isCorrect) {
        const operation = gameState.currentProblem.operation;
        
        if (!gameState.statistics.topicsPerformance[operation]) {
            gameState.statistics.topicsPerformance[operation] = {
                attempts: 0,
                correct: 0
            };
        }

        gameState.statistics.topicsPerformance[operation].attempts++;
        if (isCorrect) {
            gameState.statistics.topicsPerformance[operation].correct++;
        }

        gameState.statistics.averageAccuracy = 
            (gameState.correctAnswers / gameState.totalAttempts) * 100;

        this.updateCharts();
    }

    static updateCharts() {
        this.updatePerformanceChart();
        this.updateTopicsChart();
    }

    static updatePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const chart = Chart.getChart(ctx);
        if (chart) chart.destroy();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: gameState.statistics.recentScores.map((_, i) => `Game ${i + 1}`),
                datasets: [{
                    label: 'Score History',
                    data: gameState.statistics.recentScores,
                    borderColor: '#4361ee',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(67, 97, 238, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    static updateTopicsChart() {
        const ctx = document.getElementById('topicsChart');
        if (!ctx) return;

        const chart = Chart.getChart(ctx);
        if (chart) chart.destroy();

        const topics = Object.entries(gameState.statistics.topicsPerformance);
        const data = topics.map(([_, data]) => 
            (data.correct / data.attempts * 100) || 0
        );

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: topics.map(([topic]) => this.getOperationSymbol(topic)),
                datasets: [{
                    label: 'Topic Mastery (%)',
                    data: data,
                    backgroundColor: 'rgba(67, 97, 238, 0.2)',
                    borderColor: '#4361ee',
                    pointBackgroundColor: '#4361ee'
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 20 }
                    }
                }
            }
        });
    }

    static getOperationSymbol(op) {
        const symbols = {
            '+': 'Addition',
            '-': 'Subtraction',
            '*': 'Multiplication',
            '/': 'Division',
            '^': 'Powers',
            '√': 'Square Root'
        };
        return symbols[op] || op;
    }

    static saveGameData() {
        const gameData = {
            statistics: gameState.statistics,
            achievements: Array.from(gameState.achievements)
        };
        localStorage.setItem('mathGameData', JSON.stringify(gameData));
    }

    static loadSavedData() {
        const savedData = localStorage.getItem('mathGameData');
        if (savedData) {
            const data = JSON.parse(savedData);
            gameState.statistics = data.statistics;
            gameState.achievements = new Set(data.achievements);
        }
    }

    static restartGame() {
        if (gameState.mode) {
            this.startGame(gameState.mode);
        }
    }
}

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Export functions for HTML onclick handlers
window.selectMode = (mode) => Game.startGame(mode);
window.startDailyChallenge = () => Game.startDailyChallenge();
window.checkAnswer = () => Game.checkAnswer();
window.showHint = () => Game.showHint();
window.togglePause = () => Game.togglePause();
window.restartGame = () => Game.restartGame();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}
