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
        },
        {
            id: 'sequenceMaster',
            title: 'Sequence Master',
            description: 'Solve 10 sequence problems correctly',
            condition: (state) => state.mode === 'sequence' && state.correctAnswers >= 10
        },
        {
            id: 'equationGenius',
            title: 'Equation Genius',
            description: 'Create 5 different valid equations for the same target',
            condition: (state) => state.mode === 'equation' && state.uniqueSolutions >= 5
        },
        {
            id: 'patternPro',
            title: 'Pattern Professional',
            description: 'Solve sequence problems with 90% accuracy',
            condition: (state) => state.mode === 'sequence' && 
                                state.correctAnswers / state.totalAttempts >= 0.9 &&
                                state.totalAttempts >= 10
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
        if (!gameState.achievements.has(achievement.id)) {
            gameState.achievements.add(achievement.id);
            this.showAchievementNotification(achievement);
            Game.saveGameData();
            
            // Update achievement card visual state
            const card = document.querySelector(`[data-achievement="${achievement.id}"]`);
            if (card) {
                card.classList.add('unlocked');
            }
        }
    },

    showAchievementNotification(achievement) {
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = 'achievement-notification animate__animated animate__slideInRight';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="achievement-details">
                    <h4>Achievement Unlocked: ${achievement.title}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;

        container.appendChild(notification);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.replace('animate__slideInRight', 'animate__slideOutRight');
            setTimeout(() => notification.remove(), 1000);
        }, 3000);
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
        sequence: {
            types: ['arithmetic', 'geometric', 'fibonacci', 'skipCounting'],
            maxNumber: 50,
            timeLimit: 120,
            pointsPerQuestion: 200,
            levelThreshold: 1000
        },
        equation: {
            operations: ['+', '-', '*', '/'],
            numbersCount: 4,
            maxNumber: 20,
            timeLimit: 180,
            pointsPerQuestion: 250,
            levelThreshold: 1500
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
            sequence: 0,
            equation: 0
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

            // Handle different modes
            switch(mode) {
                case 'sequence':
                    return this.generateSequence(config);
                case 'equation':
                    return this.generateEquation(config);
                default:
                    // For basic arithmetic modes
                    if (!config.operations || config.operations.length === 0) {
                        throw new Error('No operations available');
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
            }

        } catch (error) {
            console.error('Problem generation failed:', error);
            // Return a simple fallback problem
            return this.getFallbackProblem();
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

    static generateSequence(config) {
        const type = config.types[Math.floor(Math.random() * config.types.length)];
        let sequence = [];
        let answer = 0;

        switch(type) {
            case 'arithmetic':
                const diff = Math.floor(Math.random() * 10) + 1;
                const start = Math.floor(Math.random() * 20);
                sequence = Array.from({length: 4}, (_, i) => start + diff * i);
                answer = start + diff * 4;
                break;

            case 'geometric':
                const ratio = Math.floor(Math.random() * 3) + 2;
                const startNum = Math.floor(Math.random() * 5) + 1;
                sequence = Array.from({length: 4}, (_, i) => startNum * Math.pow(ratio, i));
                answer = startNum * Math.pow(ratio, 4);
                break;

            case 'fibonacci':
                let a = 1, b = 1;
                sequence = [a, b];
                for(let i = 2; i < 4; i++) {
                    const next = a + b;
                    sequence.push(next);
                    a = b;
                    b = next;
                }
                answer = sequence[sequence.length - 1] + sequence[sequence.length - 2];
                break;

            case 'skipCounting':
                const skip = Math.floor(Math.random() * 5) + 2;
                const startVal = Math.floor(Math.random() * 10);
                sequence = Array.from({length: 4}, (_, i) => startVal + skip * i);
                answer = startVal + skip * 4;
                break;
        }

        return {
            problem: `What comes next? ${sequence.join(', ')}, ?`,
            answer: answer,
            type: type,
            sequence: sequence,
            operation: 'sequence' // Add this to maintain consistency
        };
    }

    static generateEquation(config) {
        const numbers = Array.from({length: config.numbersCount}, 
            () => Math.floor(Math.random() * config.maxNumber) + 1);
        const target = Math.floor(Math.random() * 50) + 10;

        return {
            problem: `Make ${target} using ${numbers.join(', ')}`,
            answer: target,
            numbers: numbers,
            operations: config.operations,
            operation: 'equation' // Add this to maintain consistency
        };
    }

    static validateEquation(equation, target, numbers) {
        try {
            // Create a safe evaluation environment
            const result = Function(`return ${equation}`)();
            
            // Check if result matches target
            if (Math.abs(result - target) > 0.1) return false;

            // Check if only provided numbers are used
            const usedNumbers = equation.match(/\d+/g).map(Number);
            const sortedNumbers = [...numbers].sort();
            const sortedUsed = [...usedNumbers].sort();

            return JSON.stringify(sortedNumbers) === JSON.stringify(sortedUsed);
        } catch (e) {
            return false;
        }
    }
}

// Game Class
class Game {
    static init() {
        try {
            this.bindEventListeners();
            ThemeManager.init();
            SoundManager.init();
            this.loadSavedData();
            this.showInitialState();
            this.updateStatsSection();
            this.updateAchievementsSection();
        } catch (error) {
            console.log('Initialization error:', error);
        }
    }

    static bindEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (gameState.isPlaying && !gameState.isPaused) {
                switch(e.key.toLowerCase()) {
                    case 'h': this.showHint(); break;
                    case 'p': this.togglePause(); break;
                    case 'r': this.restartGame(); break;
                    case 'enter': this.checkAnswer(); break;
                }
            }
        });

        // Focus answer input when game starts
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.checkAnswer();
                }
            });
        }
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

        // Set initial game state
        gameState.isPlaying = true;
        gameState.currentMode = mode;
        gameState.hintsLeft = CONFIG.maxHints;
        gameState.score = 0;
        gameState.level = 1;
        gameState.combo = 0;
        gameState.maxCombo = 0;
        gameState.correctAnswers = 0;
        gameState.totalAttempts = 0;
        gameState.timeLeft = CONFIG.modes[mode].timeLimit;
        gameState.startTime = Date.now();

        // Update UI with initial values
        document.getElementById('currentLevel').textContent = '1';
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('hintCount').textContent = CONFIG.maxHints;
        document.getElementById('gameTimer').textContent = UTILS.formatTime(gameState.timeLeft);

        const gameContainer = document.querySelector('.game-container');
        const modeSelection = document.querySelector('.mode-selection');
        
        // Show game container
        if (gameContainer) {
            gameContainer.classList.add('active');
        }
        // Hide mode selection
        if (modeSelection) {
            modeSelection.style.display = 'none';
        }

        this.generateNewProblem();
        this.startTimer();
        this.updateUI();
        gameState.startTime = Date.now();
        this.updateAllStats();
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

        const isCorrect = Math.abs(userAnswer - gameState.currentProblem.answer) < 0.1;

        // Update statistics
        if (!gameState.statistics.recentActivities) {
            gameState.statistics.recentActivities = [];
        }

        // Add new activity
        gameState.statistics.recentActivities.push({
            problem: { ...gameState.currentProblem }, // Clone to prevent reference issues
            answer: userAnswer,
            correct: isCorrect,
            timestamp: Date.now()
        });

        // Keep only last 50 activities
        if (gameState.statistics.recentActivities.length > 50) {
            gameState.statistics.recentActivities.shift();
        }

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }

        // Update UI
        this.updateUI();
        this.updateLevel();
        this.updateActivityFeed();
        this.saveGameData();
    }

    static handleCorrectAnswer() {
        SoundManager.play('correct');
        gameState.combo++;
        gameState.correctAnswers++;
        gameState.totalAttempts++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);

        // Immediate stats update
        this.updateQuickStats();

        const basePoints = CONFIG.modes[gameState.currentMode].pointsPerQuestion;
        const comboMultiplier = 1 + (Math.min(gameState.combo, CONFIG.maxCombo) * CONFIG.comboMultiplier);
        const points = Math.round(basePoints * comboMultiplier);

        this.updateScore(points);
        this.showComboIndicator(points);
        this.checkLevelUp();
        this.generateNewProblem();
        this.updateTopicMastery(gameState.currentProblem, true);
        this.checkAchievements();
        this.saveGameData();
    }

    static handleWrongAnswer() {
        SoundManager.play('wrong');
        gameState.combo = 0;
        gameState.totalAttempts++;

        // Immediate stats update
        this.updateQuickStats();

        if (gameState.currentMode === 'speed') {
            gameState.timeLeft = Math.max(0, gameState.timeLeft - 5);
        }

        this.showToast('Incorrect! Try again', 'error');
        this.updateTopicMastery(gameState.currentProblem, false);
        this.saveGameData();

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

    static updateTopicMastery(problem, isCorrect) {
        const operation = problem.operation;
        if (!gameState.statistics.topicsPerformance[operation]) {
            gameState.statistics.topicsPerformance[operation] = {
                attempts: 0,
                correct: 0
            };
        }

        const stats = gameState.statistics.topicsPerformance[operation];
        stats.attempts++;
        if (isCorrect) {
            stats.correct++;
        }

        // Update chart immediately
        if (document.getElementById('topicsChart')) {
            this.updateTopicsChart();
        }
    }

    static updateAllStats() {
        this.updateQuickStats();
        this.updateCharts();
        this.updateActivityFeed();
        this.updateStatsSection();
        this.saveGameData();
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
        this.updateAllStats();
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
        try {
            if (document.getElementById('stats')) {
                this.updateStats();
                this.updateStatsSection();
                this.updateActivityFeed();
            }
        } catch (error) {
            console.log('Error updating UI:', error);
        }
    }

    static showComboIndicator(points) {
        const indicator = document.createElement('div');
        indicator.className = 'combo-indicator animate__animated animate__fadeOutUp';
        indicator.textContent = `+${points} (${gameState.combo}x Combo!)`;
        document.body.appendChild(indicator);

        requestAnimationFrame(() => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(-50px)';
        });

        setTimeout(() => indicator.remove(), 1000);
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

    static updateStatistics(problem, userAnswer, isCorrect) {
        const stats = gameState.statistics;
        
        // Update basic stats
        stats.totalProblems = (stats.totalProblems || 0) + 1;
        stats.correctAnswers = (stats.correctAnswers || 0) + (isCorrect ? 1 : 0);
        
        // Update recent activities
        if (!stats.recentActivities) stats.recentActivities = [];
        stats.recentActivities.push({
            problem,
            answer: userAnswer,
            correct: isCorrect,
            timestamp: Date.now()
        });
        
        // Keep only last 50 activities
        if (stats.recentActivities.length > 50) {
            stats.recentActivities.shift();
        }
        
        // Update weekly tracking
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0);
        
        if (!stats.currentWeek || stats.currentWeek < weekStart) {
            // Reset weekly stats
            stats.currentWeek = weekStart;
            stats.weeklyProblems = 0;
            stats.weeklyPracticeSessions = 0;
        }
        
        stats.weeklyProblems = (stats.weeklyProblems || 0) + 1;
        
        // Save updated statistics
        this.saveGameData();
        
        // Update the display
        this.updateStatsSection();
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
        try {
            const savedData = localStorage.getItem('mathGameData');
            if (savedData) {
                const data = JSON.parse(savedData);
                gameState.statistics = data.statistics;
                gameState.achievements = new Set(data.achievements);
            }
        } catch (error) {
            console.log('Error loading saved data:', error);
        }
    }

    static restartGame() {
        if (gameState.currentMode) {
            this.startGame(gameState.currentMode);
        }
    }

    static closeGame() {
        if (gameState.isPlaying) {
            // Calculate practice time before closing
            const endTime = Date.now();
            const startTime = gameState.startTime || endTime;
            const sessionTimeInSeconds = Math.floor((endTime - startTime) / 1000); // Convert to seconds
            
            // Initialize totalPlayTime if it doesn't exist
            if (!gameState.statistics.totalPlayTime) {
                gameState.statistics.totalPlayTime = 0;
            }
            
            // Add current session time to total play time
            gameState.statistics.totalPlayTime += sessionTimeInSeconds;
            
            // Update other game state
            gameState.isPlaying = false;
            if (gameState.timer) clearInterval(gameState.timer);
            
            // Save game data and update display
            this.saveGameData();
            this.updateStatsSection();
        }
        
        const gameContainer = document.querySelector('.game-container');
        const modeSelection = document.querySelector('.mode-selection');
        
        gameContainer.classList.remove('active');
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
        try {
            const elements = {
                totalSolved: document.getElementById('totalSolved'),
                accuracyRate: document.getElementById('accuracyRate'),
                bestStreak: document.getElementById('bestStreak'),
                totalTime: document.getElementById('totalTime'),
                performanceChart: document.getElementById('performanceChart'),
                topicsChart: document.getElementById('topicsChart'),
                activityFeed: document.getElementById('activityFeed'),
                weeklyProgress: document.querySelector('.goals-progress')
            };

            // Update basic stats
            if (elements.totalSolved) {
                elements.totalSolved.textContent = gameState.statistics.totalProblems || 0;
            }

            if (elements.accuracyRate) {
                const accuracy = gameState.statistics.totalProblems ? 
                    (gameState.statistics.correctAnswers / gameState.statistics.totalProblems * 100).toFixed(1) : 0;
                elements.accuracyRate.textContent = `${accuracy}%`;
            }

            if (elements.bestStreak) {
                elements.bestStreak.textContent = gameState.statistics.longestStreak || 0;
            }

            // Format and display total practice time
            if (elements.totalTime) {
                const totalSeconds = gameState.statistics.totalPlayTime || 0;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                
                let timeDisplay;
                if (hours > 0) {
                    timeDisplay = `${hours}h ${minutes}m`;
                } else if (minutes > 0) {
                    timeDisplay = `${minutes}m`;
                } else {
                    timeDisplay = `${totalSeconds}s`;
                }
                
                elements.totalTime.textContent = timeDisplay;
            }

            // Update other elements
            if (elements.performanceChart) {
                this.updatePerformanceChart();
            }

            if (elements.topicsChart) {
                this.updateTopicsChart();
            }

            if (elements.activityFeed) {
                this.updateActivityFeed(elements.activityFeed);
            }

            if (elements.weeklyProgress) {
                this.updateWeeklyGoals(elements.weeklyProgress);
            }
        } catch (error) {
            console.error('Error updating stats section:', error);
        }
    }

    static updateAchievementsSection() {
        const achievementsContainer = document.getElementById('achievementsContainer');
        if (!achievementsContainer) return;

        Array.from(achievementsContainer.children).forEach(card => {
            const achievementId = card.getAttribute('data-achievement');
            card.classList.toggle('unlocked', gameState.achievements.has(achievementId));
        });
    }

    static updateActivityFeed(feedElement) {
        if (!feedElement) return;

        try {
            feedElement.innerHTML = '';
            const activities = gameState.statistics.recentActivities || [];
            const recentActivities = activities.slice(-10).reverse();

            if (recentActivities.length === 0) {
                feedElement.innerHTML = '<div class="empty-state">No recent activities</div>';
                return;
            }

            recentActivities.forEach(activity => {
                if (!activity.problem || !activity.answer) return; // Skip invalid activities

                const activityItem = document.createElement('div');
                activityItem.className = `activity-item ${activity.correct ? 'activity-correct' : 'activity-wrong'}`;

                // Format the problem display
                const problemText = activity.problem.problem
                    .replace(/\*/g, '×')
                    .replace(/\//g, '÷')
                    .replace(/\^/g, '<sup>2</sup>');

                activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-${activity.correct ? 'check' : 'times'}"></i>
                    </div>
                    <div class="activity-info">
                        <div class="activity-title">
                            ${problemText} = ${activity.answer}
                            ${!activity.correct ? ` (Correct: ${activity.problem.answer})` : ''}
                        </div>
                        <div class="activity-time">
                            <i class="ri-time-line"></i>
                            ${this.formatTimeAgo(activity.timestamp)}
                        </div>
                    </div>
                `;

                feedElement.appendChild(activityItem);
            });
        } catch (error) {
            console.error('Error updating activity feed:', error);
            feedElement.innerHTML = '<div class="activity-error">Error loading activities</div>';
        }
    }

    static updateWeeklyGoals(goalsElement) {
        const goals = {
            practice: {
                current: gameState.statistics.weeklyPracticeSessions || 0,
                target: 7,
                label: 'Practice Sessions',
                icon: 'ri-book-line'
            },
            problems: {
                current: gameState.statistics.weeklyProblems || 0,
                target: gameState.statistics.weeklyGoal || 50,
                label: 'Problems Solved',
                icon: 'ri-checkbox-circle-line'
            }
        };

        goalsElement.innerHTML = Object.entries(goals).map(([key, goal]) => `
            <div class="goal">
                <div class="goal-info">
                    <div class="goal-label">
                        <i class="${goal.icon}"></i>
                        <span>${goal.label}</span>
                    </div>
                    <span class="goal-value">${goal.current}/${goal.target}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(goal.current / goal.target * 100)}%"></div>
                </div>
            </div>
        `).join('');
    }

    static formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    static updateTopicMastery(problem, isCorrect) {
        const operation = problem.operation;
        if (!gameState.statistics.topicsPerformance) {
            gameState.statistics.topicsPerformance = {};
        }

        if (!gameState.statistics.topicsPerformance[operation]) {
            gameState.statistics.topicsPerformance[operation] = {
                attempts: 0,
                correct: 0,
                lastUpdated: Date.now()
            };
        }

        const topicStats = gameState.statistics.topicsPerformance[operation];
        topicStats.attempts++;
        if (isCorrect) {
            topicStats.correct++;
        }
        topicStats.lastUpdated = Date.now();

        // Update mastery percentage
        topicStats.mastery = (topicStats.correct / topicStats.attempts) * 100;

        // Update charts if they exist
        if (document.getElementById('topicsChart')) {
            this.updateTopicsChart();
        }
    }

    static updateLevel() {
        const levelElement = document.getElementById('currentLevel');
        if (levelElement) {
            levelElement.textContent = gameState.level;
            
            // Add animation for level up
            anime({
                targets: levelElement,
                scale: [1, 1.2, 1],
                duration: 800,
                easing: 'easeOutElastic(1, .5)'
            });
        }
    }

    static updateScore(points) {
        gameState.score += points;
        const scoreElement = document.getElementById('currentScore');
        if (scoreElement) {
            scoreElement.textContent = gameState.score.toLocaleString();
        }
    }

    static checkAchievements() {
        AchievementSystem.check(gameState);
    }

    static updateQuickStats() {
        requestAnimationFrame(() => {
            // Update solved count
            document.querySelectorAll('[id="totalSolved"]').forEach(el => {
                el.textContent = gameState.correctAnswers;
            });

            // Update accuracy
            const accuracy = gameState.totalAttempts > 0 
                ? (gameState.correctAnswers / gameState.totalAttempts * 100).toFixed(1) 
                : '0.0';
            document.querySelectorAll('[id="accuracyRate"]').forEach(el => {
                el.textContent = `${accuracy}%`;
            });

            // Update streak
            document.querySelectorAll('[id="bestStreak"]').forEach(el => {
                el.textContent = gameState.maxCombo;
            });

            // Update time
            const sessionTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            document.querySelectorAll('[id="totalTime"]').forEach(el => {
                const minutes = Math.floor(sessionTime / 60);
                const hours = Math.floor(minutes / 60);
                el.textContent = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
            });
        });
    }
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', () => {
    Game.init();

    // Mode Selection
    document.querySelectorAll('.mode-card').forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            if (mode) Game.startGame(mode);
        });
    });

    // Handle pause overlay clicks
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.addEventListener('click', () => {
            if (gameState.isPaused) {
                Game.togglePause();
            }
        });
    }
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

// Add CSS for achievement notification
const style = document.createElement('style');
style.textContent = `
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
    }
    .achievement-notification {
        display: flex;
        align-items: center;
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px);
        max-width: 300px;
        pointer-events: none;
    }

    .achievement-icon {
        margin-right: 15px;
        font-size: 24px;
        color: #FFD700;
    }

    .achievement-details h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .achievement-details p {
        margin: 5px 0 0;
        font-size: 14px;
        opacity: 0.9;
    }
`;
document.head.appendChild(style);
