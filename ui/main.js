"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore - Tauri defined at runtime in index.html
const { invoke } = window.__TAURI__.tauri;
// @ts-ignore
const { listen } = window.__TAURI__.event;
// Store event unlisteners for cleanup on unmount
const unlisteners = [];
let growthChart = null;
window.addEventListener('beforeunload', () => {
    unlisteners.forEach(unlistener => unlistener());
});
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    // Listen for async Rust calculations
    // @ts-ignore
    const unlistenTable = yield listen('table-calculated', (event) => {
        const tableData = event.payload;
        const currency = document.getElementById('currency').value;
        const canvas = document.getElementById('growthChart');
        const loading = document.getElementById('table-loading');
        loading.innerHTML = "";
        canvas.style.display = 'block';
        const labels = tableData.map(r => `Age ${r.age}`);
        const data = tableData.map(r => r.balance);
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
        const isSystemLight = document.documentElement.getAttribute('data-theme') === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches;
        const isLight = isLightTheme || isSystemLight;
        const gridColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        const textColor = isLight ? '#0f172a' : '#f8fafc';
        if (growthChart)
            growthChart.destroy();
        growthChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                        label: `Wealth Accumulation (${currency})`,
                        data: data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });
        const btn = document.getElementById('btn-calc-table');
        if (btn)
            btn.disabled = false;
    });
    unlisteners.push(unlistenTable);
    // 1. Check Rust IPC Security Status
    try {
        const status = yield invoke('get_security_status');
        const badge = document.getElementById('security-status');
        badge.textContent = status;
        badge.className = 'status-badge secure';
        // Load Persistent Theme
        const theme = yield invoke('get_theme_preference');
        const themeBtn = document.getElementById('theme-toggle');
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeBtn)
                themeBtn.innerText = '🌙 Dark Mode';
        }
        else if (theme === 'system') {
            document.documentElement.setAttribute('data-theme', 'system');
            if (themeBtn)
                themeBtn.innerText = '☀️ Light Mode';
        }
        else {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeBtn)
                themeBtn.innerText = '⚙️ System Mode';
        }
        // Fetch Initial User DB
        const db = yield invoke('get_user_db');
        document.getElementById('coin-count').innerText = db.coins;
        document.getElementById('streak-count').innerText = db.quiz_streak;
    }
    catch (e) {
        console.error("Tauri Error (Are you running in browser?):", e);
    }
    // 2. Secret Konami Code logic for the Golf Game
    let keys = [];
    const konami = "ArrowUp,ArrowUp,ArrowDown,ArrowDown";
    document.addEventListener('keydown', (e) => {
        keys.push(e.key);
        if (keys.length > 4)
            keys.shift();
        if (keys.join(',') === konami) {
            document.getElementById('golf-game-overlay').classList.remove('hidden');
            // @ts-ignore
            window.initGolf(); // Init minigame
            keys = [];
        }
    });
    // 3. Pre-load Saved API Key into Settings Input
    try {
        const db = yield invoke('get_user_db');
        if (db && db.gemini_api_key) {
            document.getElementById('gemini-key-input').value = db.gemini_api_key;
        }
    }
    catch (e) {
        console.error("Failed to load UserDB on startup:", e);
    }
}));
// @ts-ignore
window.toggleTheme = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const root = document.documentElement;
        const btn = document.getElementById('theme-toggle');
        const currentTheme = root.getAttribute('data-theme') || 'dark';
        if (currentTheme === 'dark') {
            root.setAttribute('data-theme', 'system');
            if (btn)
                btn.innerText = '☀️ Light Mode';
            yield invoke('set_theme_preference', { theme: 'system' });
        }
        else if (currentTheme === 'system') {
            root.setAttribute('data-theme', 'light');
            if (btn)
                btn.innerText = '🌙 Dark Mode';
            yield invoke('set_theme_preference', { theme: 'light' });
        }
        else {
            root.setAttribute('data-theme', 'dark');
            if (btn)
                btn.innerText = '⚙️ System Mode';
            yield invoke('set_theme_preference', { theme: 'dark' });
        }
    });
};
// @ts-ignore
window.calculateInterest = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btn-calc-interest');
        if (btn)
            btn.disabled = true;
        const principal = parseFloat(document.getElementById('principal').value);
        const currency = document.getElementById('currency').value;
        const currentAge = parseInt(document.getElementById('current-age').value) || 18;
        const duration = parseInt(document.getElementById('duration').value) || 10;
        const ratePercent = parseFloat(document.getElementById('rate').value) || 8;
        try {
            const data = yield invoke('calculate_interest', { principal, currentAge, duration, ratePercent });
            document.getElementById('interest-result').innerText =
                `By age ${data.final_age}(${duration} years at ${ratePercent} %): \n${currency}${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        catch (e) {
            document.getElementById('interest-result').innerText = `Rust Error: ${e}`;
            console.error(e);
        }
        finally {
            if (btn)
                btn.disabled = false;
        }
    });
};
// @ts-ignore
window.calculateTable = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btn-calc-table');
        if (btn)
            btn.disabled = true;
        document.getElementById('table-loading').innerHTML = "<p>Rust is rendering the Chart...</p>";
        document.getElementById('growthChart').style.display = 'none';
        const principal = parseFloat(document.getElementById('principal').value);
        const currentAge = parseInt(document.getElementById('current-age').value) || 18;
        const duration = parseInt(document.getElementById('duration').value) || 30;
        const ratePercent = parseFloat(document.getElementById('rate').value) || 8;
        try {
            yield invoke('calculate_table_async', { principal, currentAge, duration, ratePercent });
        }
        catch (e) {
            document.getElementById('table-loading').innerHTML = `< p > Rust Error: ${e} </p>`;
            console.error(e);
            if (btn)
                btn.disabled = false;
        }
    });
};
// @ts-ignore
window.loadQuiz = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield invoke('reset_quiz');
        renderQuiz();
    });
};
function renderQuiz() {
    return __awaiter(this, void 0, void 0, function* () {
        const quizResponse = yield invoke('get_quiz');
        if (quizResponse.is_complete) {
            document.getElementById('quiz-container').innerHTML = `
            <h3>Quiz Complete! 🎉</h3>
            <p>You have answered all 10 questions.</p>
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin: 10px 0; border: 1px dashed var(--primary);">
                <strong>Secret Hint Unlocked 🤫:</strong><br>
                <em>Up, Up, Down, Down</em>
            </div>
            <button onclick='loadQuiz()'>Restart Quiz</button>
        `;
            return;
        }
        const q = quizResponse.question;
        let html = `<p><strong>Question ${quizResponse.current_number}/${quizResponse.total}: ${q === null || q === void 0 ? void 0 : q.question}</strong></p>`;
        q === null || q === void 0 ? void 0 : q.options.forEach((opt, idx) => {
            html += `<button onclick="checkAnswer(${idx})">${opt}</button>`;
        });
        document.getElementById('quiz-container').innerHTML = html;
    });
}
// @ts-ignore
window.checkAnswer = function (selectedIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        const isCorrect = yield invoke('check_answer', { selected: selectedIndex });
        if (isCorrect) {
            alert('Correct!');
        }
        else {
            alert('Incorrect!');
        }
        const newQuizState = yield invoke('get_quiz');
        if (newQuizState.is_complete) {
            try {
                const db = yield invoke('increment_quiz_streak');
                document.getElementById('streak-count').innerText = db.quiz_streak;
            }
            catch (e) {
                console.error(e);
            }
        }
        renderQuiz();
    });
};
// Physics-based Golf Minigame
// Physics-based Golf Engine (Native Rust Backend)
// @ts-ignore
window.initGolf = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.getElementById('golfCanvas');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        let ball = yield invoke('init_golf');
        let hole = { x: 500, y: 200, r: 15 };
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let currentMouse = { x: 0, y: 0 };
        let gameState = 'ready'; // ready, moving, win, lose
        let awardedWin = false;
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
            }
            else if (gameState === 'lose') {
                ctx.fillText('Missed! You Lose.', canvas.width / 2, canvas.height / 2);
                ctx.font = '16px Outfit, sans-serif';
                ctx.fillText('Click to try again', canvas.width / 2, canvas.height / 2 + 30);
            }
        }
        function update() {
            return __awaiter(this, void 0, void 0, function* () {
                if (gameState === 'moving') {
                    const stateInfo = yield invoke('update_golf_physics');
                    ball = stateInfo.ball;
                    gameState = stateInfo.game_state;
                    if (gameState === 'win' && !awardedWin) {
                        awardedWin = true;
                        try {
                            const db = yield invoke('add_golf_coins', { amount: 100 });
                            document.getElementById('coin-count').innerText = db.coins;
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                draw();
                if (gameState === 'moving') {
                    requestAnimationFrame(update);
                }
            });
        }
        canvas.onmousedown = (e) => __awaiter(this, void 0, void 0, function* () {
            if (gameState === 'win' || gameState === 'lose') {
                ball = yield invoke('init_golf');
                gameState = 'ready';
                awardedWin = false;
                draw();
                return;
            }
            if (gameState !== 'ready')
                return;
            let rect = canvas.getBoundingClientRect();
            dragStart.x = e.clientX - rect.left;
            dragStart.y = e.clientY - rect.top;
            isDragging = true;
            currentMouse.x = dragStart.x;
            currentMouse.y = dragStart.y;
        });
        canvas.onmousemove = (e) => {
            if (!isDragging)
                return;
            let rect = canvas.getBoundingClientRect();
            currentMouse.x = e.clientX - rect.left;
            currentMouse.y = e.clientY - rect.top;
            draw();
        };
        canvas.onmouseup = (e) => __awaiter(this, void 0, void 0, function* () {
            if (!isDragging)
                return;
            isDragging = false;
            if (gameState === 'ready') {
                let dx = currentMouse.x - dragStart.x;
                let dy = currentMouse.y - dragStart.y;
                yield invoke('shoot_golf', { dx, dy });
                gameState = 'moving';
                requestAnimationFrame(update);
            }
            draw();
        });
        draw();
    });
};
// @ts-ignore
window.closeGolf = function () {
    document.getElementById('golf-game-overlay').classList.add('hidden');
};
// @ts-ignore
window.calculateBVR = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btn-calc-bvr');
        if (btn)
            btn.disabled = true;
        const rent = parseFloat(document.getElementById('bvr-rent').value);
        const home_price = parseFloat(document.getElementById('bvr-home').value);
        const down_payment = parseFloat(document.getElementById('bvr-down').value);
        const interest_rate = parseFloat(document.getElementById('bvr-rate').value);
        try {
            const data = yield invoke('calculate_buy_vs_rent', { rent, homePrice: home_price, downPayment: down_payment, interestRate: interest_rate });
            document.getElementById('bvr-result').innerHTML = `Crossover: <strong>${data.years_to_breakeven} Years</strong><br>System Recommendation: <strong>${data.recommendation}</strong>`;
        }
        catch (e) {
            document.getElementById('bvr-result').innerText = `Rust Error: ${e}`;
        }
        finally {
            if (btn)
                btn.disabled = false;
        }
    });
};
// @ts-ignore
window.calculateDebt = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btn-calc-debt');
        if (btn)
            btn.disabled = true;
        const debt1 = parseFloat(document.getElementById('debt-1').value);
        const debt2 = parseFloat(document.getElementById('debt-2').value);
        const monthly_payment = parseFloat(document.getElementById('debt-pay').value);
        try {
            const data = yield invoke('calculate_debt_payoff', { debt1, debt2, monthlyPayment: monthly_payment });
            document.getElementById('debt-result').innerHTML = `Snowball Method: <strong>${data.months_snowball} mo.</strong><br>Avalanche Method: <strong>${data.months_avalanche} mo.</strong>`;
        }
        catch (e) {
            document.getElementById('debt-result').innerText = `Rust Error: ${e}`;
        }
        finally {
            if (btn)
                btn.disabled = false;
        }
    });
};
// @ts-ignore
window.fetchMarket = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btn-fetch-market');
        if (btn)
            btn.disabled = true;
        const ticker = document.getElementById('market-ticker').value;
        document.getElementById('market-result').innerHTML = '<span style="font-size: 1rem;">Establishing secure link...</span>';
        try {
            const price = yield invoke('fetch_stock_price', { ticker: ticker.toUpperCase() });
            document.getElementById('market-result').innerHTML = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        catch (e) {
            document.getElementById('market-result').innerText = `Networking Error: ${e}`;
        }
        finally {
            if (btn)
                btn.disabled = false;
        }
    });
};
// @ts-ignore
window.openSettings = function () {
    document.getElementById('settings-modal').classList.remove('hidden');
};
// @ts-ignore
window.saveSettings = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const key = document.getElementById('gemini-key-input').value;
        try {
            yield invoke('set_api_key', { apiKey: key });
            document.getElementById('settings-modal').classList.add('hidden');
        }
        catch (e) {
            alert("Failed to save API KEY: " + e);
        }
    });
};
// @ts-ignore
window.sendChat = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const input = document.getElementById('chat-input');
        const history = document.getElementById('chat-history');
        const btn = document.getElementById('btn-send-chat');
        const message = input.value.trim();
        if (!message)
            return;
        // Append User Message
        const userBubble = document.createElement('div');
        userBubble.style.cssText = "background: var(--primary); color: white; padding: 0.5rem; border-radius: 5px; align-self: flex-end; max-width: 80%; margin-top: 0.5rem;";
        userBubble.innerHTML = `<strong>You:</strong> ${message}`;
        history.appendChild(userBubble);
        history.scrollTop = history.scrollHeight;
        input.value = "";
        input.disabled = true;
        btn.disabled = true;
        // Loading Bubble
        const aiBubble = document.createElement('div');
        aiBubble.style.cssText = "background: var(--glass); margin-top: 0.5rem; padding: 0.5rem; border-radius: 5px; align-self: flex-start; max-width: 80%;";
        aiBubble.innerHTML = `<strong>Tutor:</strong> Thinking...`;
        history.appendChild(aiBubble);
        history.scrollTop = history.scrollHeight;
        try {
            const response = yield invoke('ask_ai', { prompt: message });
            aiBubble.innerHTML = `<strong>Tutor:</strong> ${response.replace(/\n/g, '<br>')}`;
        }
        catch (e) {
            aiBubble.innerHTML = `<strong>Tutor:</strong> ❌ ${e}`;
            aiBubble.style.color = "red";
        }
        finally {
            input.disabled = false;
            btn.disabled = false;
            input.focus();
            history.scrollTop = history.scrollHeight;
        }
    });
};
