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
    try {
        const response = await fetch('http://127.0.0.1:8082/api/compound-interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ principal: parseFloat(principal), rate: 0.08, years: 10 })
        });
        const data = await response.json();
        document.getElementById('interest-result').innerText =
            `In 10 years at 8%: $${data.amount_after_years}`;
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

// Minimal Golf Game
function initGolf() {
    const canvas = document.getElementById('golfCanvas');
    const ctx = canvas.getContext('2d');
    let ballX = 50, ballY = 200, isDragging = false;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Hole
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(500, 200, 15, 0, Math.PI * 2); ctx.fill();
        // Ball
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(ballX, ballY, 8, 0, Math.PI * 2); ctx.fill();
    }

    // Very simple interaction
    canvas.onmousedown = () => { ballX += 50; draw(); if (ballX >= 500) alert("Hole in One!"); }
    draw();
}

function closeGolf() {
    document.getElementById('golf-game-overlay').classList.add('hidden');
}
