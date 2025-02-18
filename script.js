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
            correct: document.getElementById('correctSound'),
            wrong: document.getElementById('wrongSound'),
            levelUp: document.getElementById('levelUpSound'),
            gameOver: document.getElementById('gameOverSound')
        };

        Object.entries(soundFiles).forEach(([key, audioElement]) => {
            this.sounds[key] = audioElement;
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
        },
        {
            id: 'dailyChallenge',
            title: 'Daily Challenger',
            description: 'Complete a daily challenge',
            condition: (state) => state.isDaily && state.score > 0
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
        this.showAchievementModal(achievement);
    },

    showAchievementModal(achievement) {
        const achievementModal = new bootstrap.Modal(document.getElementById('achievementModal'));
        document.getElementById('achievementTitle').textContent = achievement.title;
        document.getElementById('achievementDescription').textContent = achievement.description;
        achievementModal.show();
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
        },
        puzzle: {
            operations: ['+', '-', '*', '/'],
            maxNumber: 50,
            timeLimit: 120,
            pointsPerQuestion: 250,
            levelThreshold: 1500
        },
        marathon: {
            operations: ['+', '-', '*', '/', '^', '√'],
            maxNumber: 100,
            timeLimit: Infinity,
            pointsPerQuestion: 300,
            levelThreshold: 2000
        }
    },
    comboMultiplier: 0.1,
    maxCombo: 10,
    hintPenalty: 0.5,
    maxHints: 5
};

// Game State
const gameState = {
    isPlaying: false,
    currentMode: null,
    hintsLeft: 5,
    mode: null,
    level: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctAnswers: 0,
    totalAttempts: 0,
    timeLeft: 0,
    timer: null,
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
            practice: 0,
            puzzle: 0,
            marathon: 0
        },
        currentStreak: 0,
        longestStreak: 0,
        weeklyGoal: 10,
        weeklyGoalProgress: 0
    }
};

// Theme Manager
const ThemeManager = {
    init() {
        this.loadSavedTheme();
        this.bindEvents();
    },

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        const themeToggleDesktop = document.getElementById('themeToggleDesktop');
        
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                this.toggleTheme();
                if (themeToggleDesktop) {
                    themeToggleDesktop.checked = themeToggle.checked;
                }
            });
        }
        
        if (themeToggleDesktop) {
            themeToggleDesktop.addEventListener('change', () => {
                this.toggleTheme();
                if (themeToggle) {
                    themeToggle.checked = themeToggleDesktop.checked;
                }
            });
        }
    },

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        
        const themeToggle = document.getElementById('themeToggle');
        const themeToggleDesktop = document.getElementById('themeToggleDesktop');
        
        if (themeToggle) {
            themeToggle.checked = savedTheme === 'dark';
        }
        if (themeToggleDesktop) {
            themeToggleDesktop.checked = savedTheme === 'dark';
        }
    },

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
};

// Problem Generator
class ProblemGenerator {
    static generate(mode) {
        try {
            const config = CONFIG.modes[mode];
            if (!config) {
                throw new Error(`Invalid game mode: ${mode}`);
            }

            const operation = this.getRandomOperation(config.operations);
            let problem = this.createProblem(operation, config);
            
            // Add default values if missing
            if (!problem.num1) problem.num1 = 0;
            if (!problem.num2) problem.num2 = 0;
            if (!problem.answer) problem.answer = 0;
            if (!problem.problem) problem.problem = '0 + 0';
            
            this.validateProblem(problem);
            return problem;

        } catch (error) {
            console.error('Problem generation failed:', error);
            // Return a simple fallback problem
            return {
                problem: '2 + 2',
                answer: 4,
                operation: '+',
                num1: 2,
                num2: 2
            };
        }
    }

    static getRandomOperation(operations) {
        if (!operations || operations.length === 0) {
            throw new Error('No operations available');
        }
        return operations[Math.floor(Math.random() * operations.length)];
    }

    static createProblem(operation, config) {
        let problem = {
            problem: '',
            answer: null,
            operation,
            num1: null,
            num2: null
        };

        switch(operation) {
            case '+':
                problem = this.generateAddition(config.maxNumber);
                break;
            case '-':
                problem = this.generateSubtraction(config.maxNumber);
                break;
            case '*':
                problem = this.generateMultiplication(config.maxNumber);
                break;
            case '/':
                problem = this.generateDivision(config.maxNumber);
                break;
            case '^':
                problem = this.generatePower(config.maxNumber);
                break;
            case '√':
                problem = this.generateSquareRoot(config.maxNumber);
                break;
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }

        return problem;
    }

    static validateProblem(problem) {
        if (!problem.problem || problem.answer === null || 
            problem.num1 === null || problem.num2 === null) {
            throw new Error('Invalid problem generated');
        }

        // Check for reasonable answer values
        if (!Number.isFinite(problem.answer) || Math.abs(problem.answer) > 1e6) {
            throw new Error('Problem answer out of reasonable range');
        }
    }

    static getFallbackProblem() {
        return {
            problem: '2 + 2',
            answer: 4,
            operation: '+',
            num1: 2,
            num2: 2
        };
    }

    // Individual operation generators
    static generateAddition(maxNumber) {
        const num1 = Math.floor(Math.random() * maxNumber) + 1;
        const num2 = Math.floor(Math.random() * maxNumber) + 1;
        return {
            problem: `${num1} + ${num2}`,
            answer: num1 + num2,
            operation: '+',
            num1,
            num2
        };
    }

    static generateSubtraction(maxNumber) {
        const num1 = Math.floor(Math.random() * maxNumber) + 1;
        const num2 = Math.floor(Math.random() * num1) + 1;
        return {
            problem: `${num1} - ${num2}`,
            answer: num1 - num2,
            operation: '-',
            num1,
            num2
        };
    }

    static generateMultiplication(maxNumber) {
        const num1 = Math.floor(Math.random() * Math.sqrt(maxNumber)) + 1;
        const num2 = Math.floor(Math.random() * Math.sqrt(maxNumber)) + 1;
        return {
            problem: `${num1} × ${num2}`,
            answer: num1 * num2,
            operation: '*',
            num1,
            num2
        };
    }

    static generateDivision(maxNumber) {
        const num2 = Math.floor(Math.random() * Math.sqrt(maxNumber)) + 1;
        const answer = Math.floor(Math.random() * 10) + 1;
        const num1 = num2 * answer;
        return {
            problem: `${num1} ÷ ${num2}`,
            answer: answer,
            operation: '/',
            num1,
            num2
        };
    }

    static generatePower(maxNumber) {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 3) + 1;
        const answer = Math.pow(num1, num2);
        return {
            problem: `${num1}<sup>${num2}</sup>`,
            answer: answer,
            operation: '^',
            num1,
            num2
        };
    }

    static generateSquareRoot(maxNumber) {
        const answer = Math.floor(Math.random() * 10) + 1;
        const num1 = answer * answer;
        return {
            problem: `√${num1}`,
            answer: answer,
            operation: '√',
            num1,
            num2: null
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
        this.updateStatsSection();
        this.updateAchievementsSection();
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

        gameState.isPlaying = true;
        gameState.currentMode = mode;
        gameState.hintsLeft = 5;
        gameState.score = 0;
        gameState.level = 1;
        gameState.combo = 0;
        gameState.maxCombo = 0;
        gameState.correctAnswers = 0;
        gameState.totalAttempts = 0;
        gameState.timeLeft = CONFIG.modes[mode].timeLimit;

        const gameContainer = document.querySelector('.game-container');
        const modeSelection = document.querySelector('.mode-selection');
        
        // Show game container
        gameContainer.classList.add('active');
        // Hide mode selection but keep it in DOM
        modeSelection.style.display = 'none';
        
        // Update hint count display
        this.updateHintCount();

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
        gameState.currentProblem = ProblemGenerator.generate(gameState.currentMode);

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
        AchievementSystem.check(gameState);
        this.updateUI();
    }

    static handleCorrectAnswer() {
        SoundManager.play('correct');
        gameState.combo++;
        gameState.correctAnswers++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);

        const basePoints = CONFIG.modes[gameState.currentMode].pointsPerQuestion;
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

        if (gameState.currentMode === 'speed') {
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
            this.showToast('No hints remaining!', 'warning');
            return;
        }

        const hintBadge = document.getElementById('hintBadge');
        if (!hintBadge) return;

        gameState.hintsLeft--;
        this.updateHintCount();

        const hint = ProblemGenerator.getHint(gameState.currentProblem);

        hintBadge.textContent = hint;
        hintBadge.style.display = 'block';
        
        hintBadge.classList.add('show-hint');

        setTimeout(() => {
            hintBadge.classList.remove('show-hint');
            setTimeout(() => {
                hintBadge.style.display = 'none';
            }, 300);
        }, 3000);
    }

    static updateHintCount() {
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

        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.style.display = gameState.isPaused ? 'block' : 'none';
        }
    }

    static startTimer() {
        if (gameState.timer) clearInterval(gameState.timer);

        if (gameState.currentMode === 'practice' || gameState.currentMode === 'marathon') return;

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
        const threshold = CONFIG.modes[gameState.currentMode].levelThreshold;
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

        if (gameState.score > gameState.statistics.bestScores[gameState.currentMode]) {
            gameState.statistics.bestScores[gameState.currentMode] = gameState.score;
        }

        this.updateStreak();
        this.saveGameData();
        this.showGameOverModal();
        this.updateStatsSection();
        this.updateAchievementsSection();

        const gameContainer = document.querySelector('.game-container');
        const modeSelection = document.querySelector('.mode-selection');
        
        // Hide game container
        gameContainer.classList.remove('active');
        // Show mode selection
        modeSelection.style.display = 'block';
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
            const threshold = CONFIG.modes[gameState.currentMode].levelThreshold;
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
        if (gameState.currentMode) {
            this.startGame(gameState.currentMode);
        }
    }

    static closeGame() {
        gameState.isPlaying = false;
        if (gameState.timer) clearInterval(gameState.timer);
        
        const gameContainer = document.querySelector('.game-container');
        const modeSelection = document.querySelector('.mode-selection');
        
        // Hide game container
        gameContainer.classList.remove('active');
        // Show mode selection
        modeSelection.style.display = 'block';
    }

    static updateStreak() {
        if (gameState.correctAnswers > 0) {
            gameState.statistics.currentStreak++;
            gameState.statistics.longestStreak = Math.max(gameState.statistics.longestStreak, gameState.statistics.currentStreak);
        } else {
            gameState.statistics.currentStreak = 0;
        }

        gameState.statistics.weeklyGoalProgress++;
        if (gameState.statistics.weeklyGoalProgress >= gameState.statistics.weeklyGoal) {
            this.showToast('Weekly Goal Achieved!', 'success');
        }
    }

    static updateStatsSection() {
        document.getElementById('currentStreak').textContent = gameState.statistics.currentStreak;
        document.getElementById('longestStreak').textContent = gameState.statistics.longestStreak;
        document.getElementById('weeklyGoal').textContent = gameState.statistics.weeklyGoal;
        
        const weeklyGoalProgress = document.getElementById('weeklyGoalProgress');
        if (weeklyGoalProgress) {
            const progress = (gameState.statistics.weeklyGoalProgress / gameState.statistics.weeklyGoal) * 100;
            anime({
                targets: weeklyGoalProgress,
                width: `${progress}%`,
                duration: 300,
                easing: 'easeOutCubic'
            });
        }

        const recentActivity = document.getElementById('recentActivity');
        if (recentActivity) {
            recentActivity.innerHTML = '';
            gameState.statistics.recentScores.slice().reverse().forEach((score, index) => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.textContent = `Game ${index + 1}: Score ${score}`;
                recentActivity.appendChild(item);
            });
        }
    }

    static updateAchievementsSection() {
        const achievementsContainer = document.getElementById('achievementsContainer');
        if (!achievementsContainer) return;

        Array.from(achievementsContainer.children).forEach(card => {
            const achievementId = card.getAttribute('data-achievement');
            const achievement = AchievementSystem.achievements.find(a => a.id === achievementId);
            if (achievement && gameState.achievements.has(achievement.id)) {
                card.classList.add('unlocked');
            } else { card.classList.add('unlocked');
            }
        });
    }
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', () => {
    Game.init();

    // Mode Selection
    const modeButtons = document.querySelectorAll('.mode-card');
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            if (mode) Game.startGame(mode);
        });
    });

    // Pause Overlay Click Handler
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.addEventListener('click', () => {
            if (gameState.isPaused) {
                Game.togglePause();
            }
        });
    }

    // Key Bindings for Answer Input
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                Game.checkAnswer();
            }
        });
    }

    // Initialize theme manager
    ThemeManager.init();
});

// Global Function Declarations (for HTML onclick handlers)
function selectMode(mode) {
    Game.startGame(mode);
}

function checkAnswer() {
    Game.checkAnswer();
}

function showHint() {
    Game.showHint();
}

function togglePause() {
    Game.togglePause();
}

function restartGame() {
    Game.restartGame();
}

function closeGame() {
    Game.closeGame();
}

function startDailyChallenge() {
    Game.startDailyChallenge();
}

// Initialize the game
Game.init();

// Performance tracking object
const performanceTracker = {
    operations: {
        addition: { correct: 0, wrong: 0, total: 0, totalTime: 0, slowResponses: 0 },
        subtraction: { correct: 0, wrong: 0, total: 0, totalTime: 0, slowResponses: 0 },
        multiplication: { correct: 0, wrong: 0, total: 0, totalTime: 0, slowResponses: 0 },
        division: { correct: 0, wrong: 0, total: 0, totalTime: 0, slowResponses: 0 }
    },
    bestCombo: 0,
    currentCombo: 0,
    totalScore: 0,
    difficulty: 'easy',
    hintsRemaining: 10, // Default for easy mode
    timeThresholds: {
        addition: 3,      // seconds
        subtraction: 4,
        multiplication: 5,
        division: 6
    }
};

function initializeGame(difficulty) {
    performanceTracker.difficulty = difficulty;
    performanceTracker.hintsRemaining = difficulty === 'easy' ? 10 : 3;
    resetPerformanceTracker();
}

function trackAnswer(operation, isCorrect, timeSpent) {
    const stats = performanceTracker.operations[operation];
    stats.total++;
    
    if (isCorrect) {
        stats.correct++;
        performanceTracker.currentCombo++;
        performanceTracker.bestCombo = Math.max(performanceTracker.bestCombo, performanceTracker.currentCombo);
    } else {
        stats.wrong++;
        performanceTracker.currentCombo = 0;
    }
    
    // Track slow responses
    if (timeSpent > performanceTracker.timeThresholds[operation]) {
        stats.slowResponses++;
    }
    
    stats.totalTime += timeSpent;
}

function analyzePerformance() {
    const analysis = {
        weakestAreas: [],
        suggestions: []
    };

    for (const [operation, stats] of Object.entries(performanceTracker.operations)) {
        if (stats.total === 0) continue;

        const accuracy = (stats.correct / stats.total) * 100;
        const avgTime = stats.totalTime / stats.total;
        const slowResponseRate = (stats.slowResponses / stats.total) * 100;

        // Identify problems
        if (accuracy < 70) {
            analysis.weakestAreas.push({
                operation,
                issue: 'accuracy',
                value: accuracy.toFixed(1)
            });
        }

        if (slowResponseRate > 30) {
            analysis.weakestAreas.push({
                operation,
                issue: 'speed',
                value: avgTime.toFixed(1)
            });
        }

        // Generate specific suggestions
        if (stats.wrong > stats.correct) {
            analysis.suggestions.push(getDetailedSuggestion(operation, 'accuracy'));
        }
        if (stats.slowResponses > stats.total * 0.3) {
            analysis.suggestions.push(getDetailedSuggestion(operation, 'speed'));
        }
    }

    return analysis;
}

function getDetailedSuggestion(operation, problemType) {
    const suggestions = {
        addition: {
            accuracy: [
                "Practice basic addition facts up to 20",
                "Focus on carrying numbers in multi-digit addition",
                "Try breaking numbers into friendly pairs"
            ],
            speed: [
                "Practice mental math strategies",
                "Work on number bonds to 10",
                "Use doubles and near-doubles facts"
            ]
        },
        subtraction: {
            accuracy: [
                "Review borrowing with multi-digit numbers",
                "Practice basic subtraction facts",
                "Work on number relationships"
            ],
            speed: [
                "Practice counting backwards",
                "Use addition to check subtraction",
                "Work on mental math strategies"
            ]
        },
        multiplication: {
            accuracy: [
                "Review multiplication tables",
                "Practice breaking larger numbers into smaller factors",
                "Focus on understanding place value"
            ],
            speed: [
                "Practice skip counting",
                "Learn multiplication patterns",
                "Use known facts to solve harder problems"
            ]
        },
        division: {
            accuracy: [
                "Review division facts and relationships",
                "Practice with remainders",
                "Work on estimation skills"
            ],
            speed: [
                "Practice related multiplication facts",
                "Use halving and doubling strategies",
                "Work on mental division tricks"
            ]
        }
    };

    const operationSuggestions = suggestions[operation][problemType];
    return {
        operation,
        problemType,
        tips: operationSuggestions
    };
}

// Show game over modal with performance data
function showGameOverModal() {
    const performance = analyzePerformance();
    const modal = document.getElementById('gameOverModal');
    
    // Update final stats
    document.getElementById('finalScore').textContent = performanceTracker.totalScore;
    document.getElementById('finalAccuracy').textContent = calculateOverallAccuracy() + '%';
    document.getElementById('bestCombo').textContent = `×${performanceTracker.bestCombo}`;
    
    // Update operation stats
    for (const [operation, stats] of Object.entries(performance)) {
        updateOperationStats(operation, stats);
    }
    
    // Update improvement suggestions
    const suggestions = performance.suggestions.map(s => `<p>• ${s.tips.join(', ')}</p>`).join('');
    const suggestionsElement = document.getElementById('improvementSuggestions');
    suggestionsElement.innerHTML = suggestions.length > 0 
        ? suggestions
        : '<p>Great job! Keep practicing to maintain your skills.</p>';
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Update operation stats in modal
function updateOperationStats(operation, stats) {
    const statElement = document.getElementById(`${operation}Stat`);
    if (!statElement) return;
    
    const progressBar = statElement.querySelector('.progress-bar');
    const accuracyValue = statElement.querySelector('.accuracy-value');
    const avgTime = statElement.querySelector('.avg-time');
    
    progressBar.style.width = `${stats.accuracy}%`;
    progressBar.style.backgroundColor = getAccuracyColor(stats.accuracy);
    accuracyValue.textContent = `${stats.accuracy}%`;
    avgTime.textContent = `Avg: ${stats.avgTime.toFixed(1)}s`;
}

// Helper function to get color based on accuracy
function getAccuracyColor(accuracy) {
    if (accuracy >= 90) return '#4CAF50';
    if (accuracy >= 70) return '#FFC107';
    return '#F44336';
}

// Calculate overall accuracy
function calculateOverallAccuracy() {
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    for (const stats of Object.values(performanceTracker.operations)) {
        totalCorrect += stats.correct;
        totalQuestions += stats.total;
    }
    
    return totalQuestions > 0 
        ? ((totalCorrect / totalQuestions) * 100).toFixed(1)
        : '0.0';
}

// Reset performance tracker
function resetPerformanceTracker() {
    for (const operation of Object.keys(performanceTracker.operations)) {
        performanceTracker.operations[operation] = { correct: 0, wrong: 0, total: 0, totalTime: 0, slowResponses: 0 };
    }
    performanceTracker.bestCombo = 0;
    performanceTracker.currentCombo = 0;
    performanceTracker.totalScore = 0;
    performanceTracker.startTime = Date.now();
    performanceTracker.lastAnswerTime = null;
}
