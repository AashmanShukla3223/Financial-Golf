const { invoke } = window.__TAURI__.tauri;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Rust IPC Security Status
    try {
        const status = await invoke('get_security_status');
        const badge = document.getElementById('security-status');
        badge.textContent = status;
        badge.className = 'status-badge secure';
    } catch (e) {
        console.error("Tauri Error (Are you running in browser?):", e);
    }

    // 2. Secret Konami Code logic for the Golf Game
    let keys = [];
    const konami = "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a";
    document.addEventListener('keydown', (e) => {
        keys.push(e.key);
        if (keys.length > 10) keys.shift();
        if (keys.join(',') === konami) {
            document.getElementById('golf-game-overlay').classList.remove('hidden');
            initGolf(); // Init minigame
            keys = [];
        }
    });
});

async function calculateInterest() {
    const principal = parseFloat(document.getElementById('principal').value);
    const currency = document.getElementById('currency').value;
    const currentAge = parseInt(document.getElementById('current-age').value) || 18;
    const duration = parseInt(document.getElementById('duration').value) || 10;
    const ratePercent = parseFloat(document.getElementById('rate').value) || 8;
    const rate = ratePercent / 100.0;

    // Secure financial calculation (Ported from Python)
    const amount = principal * Math.pow((1 + rate), duration);
    const finalAge = currentAge + duration;

    document.getElementById('interest-result').innerText =
        `By age ${finalAge} (${duration} years at ${ratePercent}%):\n${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

let quizData = [
    {
        question: "What is an emergency fund?",
        options: ["Money for buying a new video game", "Savings specifically for unexpected expenses", "A loan from the bank", "Money you invest in the stock market"],
        answer: 1,
    },
    {
        question: "What does ROI stand for?",
        options: ["Rate of Inflation", "Return on Investment", "Risk over Income", "Ratio of Interest"],
        answer: 1,
    },
    {
        question: "Which of the following is considered a 'fixed expense'?",
        options: ["Monthly rent", "Groceries", "Entertainment", "Gas for your car"],
        answer: 0,
    },
    {
        question: "What is compound interest?",
        options: ["Interest you pay on credit cards", "Interest calculated only on the initial principal", "Interest earned on both the principal and the accumulated interest", "A type of tax"],
        answer: 2,
    },
    {
        question: "What is the purpose of a credit score?",
        options: ["To determine your tax bracket", "To show how much money you have in the bank", "To track your daily spending", "To measure your creditworthiness and likelihood to repay debt"],
        answer: 3,
    },
    {
        question: "What is a 'bull market'?",
        options: ["A market where prices are falling", "A market where prices are rising", "A market only for agricultural goods", "A market with no trading activity"],
        answer: 1,
    },
    {
        question: "What does it mean to 'diversify' your investments?",
        options: ["Putting all your money into one successful company", "Spreading your money across different types of investments to reduce risk", "Only investing in international stocks", "Keeping all your money in a savings account"],
        answer: 1,
    },
    {
        question: "Which asset is generally considered the most 'liquid'?",
        options: ["Real Estate", "A 10-year Treasury Bond", "Cash in a checking account", "Collectibles (like art or trading cards)"],
        answer: 2,
    },
    {
        question: "What is inflation?",
        options: ["The general increase in prices and fall in the purchasing power of money", "When a balloon pops", "A sudden increase in your paycheck", "The interest paid on savings accounts"],
        answer: 0,
    },
    {
        question: "What does 'pay yourself first' mean in budgeting?",
        options: ["Buying things you want before paying bills", "Setting aside a portion of your income for savings or investing before paying any other expenses", "Paying your own salary if you own a business", "Taking out a cash advance"],
        answer: 1,
    }
];
let currentQuizIndex = 0;

function loadQuiz() {
    currentQuizIndex = 0;
    renderQuiz();
}

function renderQuiz() {
    if (currentQuizIndex >= quizData.length) {
        document.getElementById('quiz-container').innerHTML = "<h3>Quiz Complete! 🎉</h3><p>You have answered all 10 questions.</p><button onclick='loadQuiz()'>Restart Quiz</button>";
        return;
    }

    const q = quizData[currentQuizIndex];
    let html = `<p><strong>Question ${currentQuizIndex + 1}/${quizData.length}: ${q.question}</strong></p>`;
    q.options.forEach((opt, idx) => {
        html += `<button onclick="checkAnswer(${idx}, ${q.answer})">${opt}</button>`;
    });
    document.getElementById('quiz-container').innerHTML = html;
}

window.checkAnswer = function (selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        alert('Correct!');
    } else {
        alert('Incorrect!');
    }
    currentQuizIndex++;
    renderQuiz();
}

// Physics-based Golf Minigame
function initGolf() {
    const canvas = document.getElementById('golfCanvas');
    const ctx = canvas.getContext('2d');

    let ball = { x: 50, y: 200, r: 8, vx: 0, vy: 0 };
    let hole = { x: 500, y: 200, r: 15 };

    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let currentMouse = { x: 0, y: 0 };
    let gameState = 'ready'; // ready, moving, win, lose

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Hole
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
        ctx.fill();

        // Draw Ball
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        // Draw Slingshot Aim Line
        if (isDragging && gameState === 'ready') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y);
            let dx = currentMouse.x - dragStart.x;
            let dy = currentMouse.y - dragStart.y;
            ctx.lineTo(ball.x - dx, ball.y - dy);
            ctx.stroke();
        }

        // Draw Game Overlays
        ctx.fillStyle = 'white';
        ctx.font = '24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        if (gameState === 'win') {
            ctx.fillText('Hole in One! 🎉', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Outfit, sans-serif';
            ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 30);
        } else if (gameState === 'lose') {
            ctx.fillText('Missed! You Lose.', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Outfit, sans-serif';
            ctx.fillText('Click to try again', canvas.width / 2, canvas.height / 2 + 30);
        }
    }

    function update() {
        if (gameState === 'moving') {
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Friction
            ball.vx *= 0.98;
            ball.vy *= 0.98;

            // Wall Collisions
            if (ball.x - ball.r < 0 || ball.x + ball.r > canvas.width) {
                ball.vx *= -0.8;
                ball.x = ball.x - ball.r < 0 ? ball.r : canvas.width - ball.r;
            }
            if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height) {
                ball.vy *= -0.8;
                ball.y = ball.y - ball.r < 0 ? ball.r : canvas.height - ball.r;
            }

            // Check Hole Collision
            let dist = Math.hypot(ball.x - hole.x, ball.y - hole.y);
            if (dist < hole.r) {
                gameState = 'win';
                ball.vx = 0; ball.vy = 0;
            }

            // Check if Stopped
            if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1 && gameState === 'moving') {
                ball.vx = 0; ball.vy = 0;
                gameState = 'lose';
            }
        }
        draw();
        if (gameState === 'moving') {
            requestAnimationFrame(update);
        }
    }

    // Input handlers mapping directly to the slingshot mechanic
    canvas.onmousedown = (e) => {
        if (gameState === 'win' || gameState === 'lose') {
            ball = { x: 50, y: 200, r: 8, vx: 0, vy: 0 };
            gameState = 'ready';
            draw();
            return;
        }
        if (gameState !== 'ready') return;

        let rect = canvas.getBoundingClientRect();
        dragStart.x = e.clientX - rect.left;
        dragStart.y = e.clientY - rect.top;
        isDragging = true;
        currentMouse.x = dragStart.x;
        currentMouse.y = dragStart.y;
    };

    canvas.onmousemove = (e) => {
        if (!isDragging) return;
        let rect = canvas.getBoundingClientRect();
        currentMouse.x = e.clientX - rect.left;
        currentMouse.y = e.clientY - rect.top;
        draw();
    };

    canvas.onmouseup = (e) => {
        if (!isDragging) return;
        isDragging = false;
        if (gameState === 'ready') {
            let dx = currentMouse.x - dragStart.x;
            let dy = currentMouse.y - dragStart.y;

            // Shoot in opposite direction of drag
            ball.vx = -dx * 0.15;
            ball.vy = -dy * 0.15;

            if (Math.abs(ball.vx) > 0.5 || Math.abs(ball.vy) > 0.5) {
                gameState = 'moving';
                requestAnimationFrame(update);
            }
        }
        draw();
    };

    draw();
}

function closeGolf() {
    document.getElementById('golf-game-overlay').classList.add('hidden');
}
