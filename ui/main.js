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
    const principal = document.getElementById('principal').value;
    const currency = document.getElementById('currency').value;
    const currentAge = parseInt(document.getElementById('current-age').value) || 18;
    const duration = parseInt(document.getElementById('duration').value) || 10;
    const ratePercent = parseFloat(document.getElementById('rate').value) || 8;
    const rate = ratePercent / 100.0;

    try {
        const response = await fetch('http://127.0.0.1:8082/api/compound-interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ principal: parseFloat(principal), rate: rate, years: duration })
        });
        const data = await response.json();
        const finalAge = currentAge + duration;
        document.getElementById('interest-result').innerText =
            `By age ${finalAge} (${duration} years at ${ratePercent}%):\n${currency}${data.amount_after_years.toLocaleString()}`;
    } catch (e) {
        document.getElementById('interest-result').innerText = "Simulated Python Server Offline (Waiting for Sidecar)";
    }
}

let quizData = [];
let currentQuizIndex = 0;

async function loadQuiz() {
    try {
        const response = await fetch('http://127.0.0.1:8081/api/quiz');
        quizData = await response.json();
        currentQuizIndex = 0;
        renderQuiz();
    } catch (e) {
        document.getElementById('quiz-container').innerHTML = "<p>Simulated Go Server Offline (Waiting for Sidecar)</p>";
    }
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
