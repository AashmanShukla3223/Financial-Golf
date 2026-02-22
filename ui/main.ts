// @ts-ignore - Tauri defined at runtime in index.html
const { invoke } = window.__TAURI__.tauri;
// @ts-ignore
const { listen } = window.__TAURI__.event;

import type { InterestResult } from './bindings/InterestResult';
import type { QuizResponse } from './bindings/QuizResponse';
import type { Ball } from './bindings/Ball';
import type { GolfRenderState } from './bindings/GolfRenderState';
import type { TableRow } from './bindings/TableRow';

// Store event unlisteners for cleanup on unmount
const unlisteners: Array<() => void> = [];

window.addEventListener('beforeunload', () => {
    unlisteners.forEach(unlistener => unlistener());
});

document.addEventListener('DOMContentLoaded', async () => {
    // Listen for async Rust calculations
    // @ts-ignore
    const unlistenTable = await listen('table-calculated', (event) => {
        const tableData: TableRow[] = event.payload;
        const currency = (document.getElementById('currency') as HTMLSelectElement).value;
        let html = '<table class="data-table"><tr><th>Year</th><th>Age</th><th>Balance</th></tr>';
        tableData.forEach(row => {
            html += `<tr><td>${row.year}</td><td>${row.age}</td><td>${currency}${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('table-container')!.innerHTML = html;
        const btn = document.getElementById('btn-calc-table') as HTMLButtonElement;
        if (btn) btn.disabled = false;
    });
    unlisteners.push(unlistenTable);

    // 1. Check Rust IPC Security Status
    try {
        const status: string = await invoke('get_security_status');
        const badge = document.getElementById('security-status')!;
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
    const btn = document.getElementById('btn-calc-interest') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    const principal = parseFloat((document.getElementById('principal') as HTMLInputElement).value);
    const currency = (document.getElementById('currency') as HTMLSelectElement).value;
    const currentAge = parseInt((document.getElementById('current-age') as HTMLInputElement).value) || 18;
    const duration = parseInt((document.getElementById('duration') as HTMLInputElement).value) || 10;
    const ratePercent = parseFloat((document.getElementById('rate') as HTMLInputElement).value) || 8;

    try {
        const data: InterestResult = await invoke('calculate_interest', { principal, currentAge, duration, ratePercent });

        document.getElementById('interest-result')!.innerText =
            `By age ${data.final_age} (${duration} years at ${ratePercent}%):\n${currency}${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (e) {
        document.getElementById('interest-result')!.innerText = `Rust Error: ${e}`;
        console.error(e);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// @ts-ignore
window.calculateTable = async function () {
    const btn = document.getElementById('btn-calc-table') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    document.getElementById('table-container')!.innerHTML = "<p>Rust is generating the 30-year table asynchronously...</p>";
    const principal = parseFloat((document.getElementById('principal') as HTMLInputElement).value);
    const currentAge = parseInt((document.getElementById('current-age') as HTMLInputElement).value) || 18;
    const duration = parseInt((document.getElementById('duration') as HTMLInputElement).value) || 30;
    const ratePercent = parseFloat((document.getElementById('rate') as HTMLInputElement).value) || 8;

    try {
        await invoke('calculate_table_async', { principal, currentAge, duration, ratePercent });
    } catch (e) {
        document.getElementById('table-container')!.innerHTML = `<p>Rust Error: ${e}</p>`;
        console.error(e);
        if (btn) btn.disabled = false; // Re-enable if error, otherwise event listener re-enables it
    }
}

// @ts-ignore
window.loadQuiz = async function () {
    await invoke('reset_quiz');
    renderQuiz();
}

async function renderQuiz() {
    const quizResponse = await invoke('get_quiz');

    if (quizResponse.is_complete) {
        document.getElementById('quiz-container').innerHTML = "<h3>Quiz Complete! 🎉</h3><p>You have answered all 10 questions.</p><button onclick='loadQuiz()'>Restart Quiz</button>";
        return;
    }

    const q = quizResponse.question;
    let html = `<p><strong>Question ${quizResponse.current_number}/${quizResponse.total}: ${q.question}</strong></p>`;
    q.options.forEach((opt, idx) => {
        html += `<button onclick="checkAnswer(${idx})">${opt}</button>`;
    });
    document.getElementById('quiz-container').innerHTML = html;
}

window.checkAnswer = async function (selectedIndex) {
    const isCorrect = await invoke('check_answer', { selected: selectedIndex });
    if (isCorrect) {
        alert('Correct!');
    } else {
        alert('Incorrect!');
    }
    renderQuiz();
}

// Physics-based Golf Minigame
// Physics-based Golf Engine (Native Rust Backend)
async function initGolf() {
    const canvas = document.getElementById('golfCanvas');
    const ctx = canvas.getContext('2d');

    let ball = await invoke('init_golf');
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

    async function update() {
        if (gameState === 'moving') {
            const stateInfo: GolfRenderState = await invoke('update_golf_physics');
            ball = stateInfo.ball;
            gameState = stateInfo.game_state;
        }
        draw();
        if (gameState === 'moving') {
            requestAnimationFrame(update);
        }
    }

    canvas.onmousedown = async (e) => {
        if (gameState === 'win' || gameState === 'lose') {
            ball = await invoke('init_golf');
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

    canvas.onmouseup = async (e) => {
        if (!isDragging) return;
        isDragging = false;
        if (gameState === 'ready') {
            let dx = currentMouse.x - dragStart.x;
            let dy = currentMouse.y - dragStart.y;

            await invoke('shoot_golf', { dx, dy });
            gameState = 'moving';
            requestAnimationFrame(update);
        }
        draw();
    };

    draw();
}

function closeGolf() {
    document.getElementById('golf-game-overlay').classList.add('hidden');
}
