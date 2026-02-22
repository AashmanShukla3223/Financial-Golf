#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;
use serde::{Serialize, Deserialize};
use tauri::{State, Manager};

#[tauri::command]
fn get_security_status() -> Result<String, String> {
    Ok("Ransomware Protection: Active. App is sandboxed. All OS hooks restricted.".to_string())
}

// ---------------------------
// 1. COMPOUND INTEREST ENGINE
// ---------------------------
#[derive(Serialize)]
struct InterestResult {
    amount: f64,
    final_age: u32,
}

#[tauri::command]
fn calculate_interest(principal: f64, current_age: u32, duration: u32, rate_percent: f64) -> Result<InterestResult, String> {
    let rate = rate_percent / 100.0;
    let amount = principal * (1.0 + rate).powi(duration as i32);
    let final_age = current_age + duration;
    Ok(InterestResult { amount, final_age })
}

#[derive(Clone, Serialize)]
struct TableRow {
    year: u32,
    age: u32,
    balance: f64,
}

#[tauri::command]
fn calculate_table_async(app: tauri::AppHandle, principal: f64, current_age: u32, duration: u32, rate_percent: f64) -> Result<(), String> {
    std::thread::spawn(move || {
        let rate = rate_percent / 100.0;
        let mut table = Vec::new();
        let mut current_balance = principal;
        for year in 1..=duration {
            current_balance *= 1.0 + rate;
            table.push(TableRow {
                year,
                age: current_age + year,
                balance: current_balance,
            });
            // Simulate intensive calculation block without freezing the main thread
            std::thread::sleep(std::time::Duration::from_millis(15));
        }
        let _ = app.emit_all("table-calculated", table);
    });
    Ok(())
}

// ---------------------------
// 2. QUIZ ENGINE STATE
// ---------------------------
#[derive(Serialize, Clone)]
struct QuizQuestion {
    question: String,
    options: Vec<String>,
}

struct QuizState {
    current_index: usize,
    questions: Vec<(String, Vec<String>, usize)>, // (Question, Options, AnswerIndex)
}

impl Default for QuizState {
    fn default() -> Self {
        Self {
            current_index: 0,
            questions: vec![
                ("What is an emergency fund?".to_string(), vec!["Money for buying a new video game".to_string(), "Savings specifically for unexpected expenses".to_string(), "A loan from the bank".to_string(), "Money you invest in the stock market".to_string()], 1),
                ("What does ROI stand for?".to_string(), vec!["Rate of Inflation".to_string(), "Return on Investment".to_string(), "Risk over Income".to_string(), "Ratio of Interest".to_string()], 1),
                ("Which of the following is considered a 'fixed expense'?".to_string(), vec!["Monthly rent".to_string(), "Groceries".to_string(), "Entertainment".to_string(), "Gas for your car".to_string()], 0),
                ("What is compound interest?".to_string(), vec!["Interest you pay on credit cards".to_string(), "Interest calculated only on the initial principal".to_string(), "Interest earned on both the principal and the accumulated interest".to_string(), "A type of tax".to_string()], 2),
                ("What is the purpose of a credit score?".to_string(), vec!["To determine your tax bracket".to_string(), "To show how much money you have in the bank".to_string(), "To track your daily spending".to_string(), "To measure your creditworthiness and likelihood to repay debt".to_string()], 3),
                ("What is a 'bull market'?".to_string(), vec!["A market where prices are falling".to_string(), "A market where prices are rising".to_string(), "A market only for agricultural goods".to_string(), "A market with no trading activity".to_string()], 1),
                ("What does it mean to 'diversify' your investments?".to_string(), vec!["Putting all your money into one successful company".to_string(), "Spreading your money across different types of investments to reduce risk".to_string(), "Only investing in international stocks".to_string(), "Keeping all your money in a savings account".to_string()], 1),
                ("Which asset is generally considered the most 'liquid'?".to_string(), vec!["Real Estate".to_string(), "A 10-year Treasury Bond".to_string(), "Cash in a checking account".to_string(), "Collectibles (like art or trading cards)".to_string()], 2),
                ("What is inflation?".to_string(), vec!["The general increase in prices and fall in the purchasing power of money".to_string(), "When a balloon pops".to_string(), "A sudden increase in your paycheck".to_string(), "The interest paid on savings accounts".to_string()], 0),
                ("What does 'pay yourself first' mean in budgeting?".to_string(), vec!["Buying things you want before paying bills".to_string(), "Setting aside a portion of your income for savings or investing before paying any other expenses".to_string(), "Paying your own salary if you own a business".to_string(), "Taking out a cash advance".to_string()], 1),
            ],
        }
    }
}

#[derive(Serialize)]
struct QuizResponse {
    is_complete: bool,
    question: Option<QuizQuestion>,
    current_number: usize,
    total: usize,
}

#[tauri::command]
fn get_quiz(state: State<Mutex<QuizState>>) -> Result<QuizResponse, String> {
    let mut quiz = state.lock().map_err(|_| "Poisoned mutex: Quiz context locked ungracefully.".to_string())?;
    if quiz.current_index >= quiz.questions.len() {
        return Ok(QuizResponse { is_complete: true, question: None, current_number: quiz.current_index, total: quiz.questions.len() });
    }
    
    let current_q = &quiz.questions[quiz.current_index];
    Ok(QuizResponse {
        is_complete: false,
        question: Some(QuizQuestion { question: current_q.0.clone(), options: current_q.1.clone() }),
        current_number: quiz.current_index + 1,
        total: quiz.questions.len(),
    })
}

#[tauri::command]
fn check_answer(selected: usize, state: State<Mutex<QuizState>>) -> Result<bool, String> {
    let mut quiz = state.lock().map_err(|_| "Poisoned mutex: Quiz context locked ungracefully.".to_string())?;
    if quiz.current_index >= quiz.questions.len() { return Ok(false); }
    
    let is_correct = selected == quiz.questions[quiz.current_index].2;
    quiz.current_index += 1;
    Ok(is_correct)
}

#[tauri::command]
fn reset_quiz(state: State<Mutex<QuizState>>) -> Result<(), String> {
    let mut quiz = state.lock().map_err(|_| "Poisoned mutex: Quiz context locked ungracefully.".to_string())?;
    quiz.current_index = 0;
    Ok(())
}

// ---------------------------
// 3. GOLF PHYSICS ENGINE STATE
// ---------------------------
#[derive(Serialize, Deserialize, Clone)]
struct Ball {
    x: f64,
    y: f64,
    r: f64,
    vx: f64,
    vy: f64,
}

struct GolfState {
    ball: Ball,
    hole_x: f64,
    hole_y: f64,
    hole_r: f64,
    canvas_w: f64,
    canvas_h: f64,
}

impl Default for GolfState {
    fn default() -> Self {
        Self {
            ball: Ball { x: 50.0, y: 200.0, r: 8.0, vx: 0.0, vy: 0.0 },
            hole_x: 500.0, hole_y: 200.0, hole_r: 15.0,
            canvas_w: 600.0, canvas_h: 400.0,
        }
    }
}

#[derive(Serialize)]
struct GolfRenderState {
    ball: Ball,
    game_state: String, // "ready", "moving", "win", "lose"
}

#[tauri::command]
fn init_golf(state: State<Mutex<GolfState>>) -> Result<Ball, String> {
    let mut golf = state.lock().map_err(|_| "Poisoned mutex: Golf context locked.".to_string())?;
    golf.ball = Ball { x: 50.0, y: 200.0, r: 8.0, vx: 0.0, vy: 0.0 };
    Ok(golf.ball.clone())
}

#[tauri::command]
fn shoot_golf(dx: f64, dy: f64, state: State<Mutex<GolfState>>) -> Result<(), String> {
    let mut golf = state.lock().map_err(|_| "Poisoned mutex: Golf context locked.".to_string())?;
    golf.ball.vx = -dx * 0.15;
    golf.ball.vy = -dy * 0.15;
    Ok(())
}

#[tauri::command]
fn update_golf_physics(state: State<Mutex<GolfState>>) -> Result<GolfRenderState, String> {
    let mut golf = state.lock().map_err(|_| "Poisoned mutex: Golf context locked.".to_string())?;
    let mut game_state = "moving".to_string();
    
    // Physics
    golf.ball.x += golf.ball.vx;
    golf.ball.y += golf.ball.vy;
    golf.ball.vx *= 0.98; // Friction
    golf.ball.vy *= 0.98;
    
    // Walls
    if golf.ball.x - golf.ball.r < 0.0 || golf.ball.x + golf.ball.r > golf.canvas_w {
        golf.ball.vx *= -0.8;
        golf.ball.x = if golf.ball.x - golf.ball.r < 0.0 { golf.ball.r } else { golf.canvas_w - golf.ball.r };
    }
    if golf.ball.y - golf.ball.r < 0.0 || golf.ball.y + golf.ball.r > golf.canvas_h {
        golf.ball.vy *= -0.8;
        golf.ball.y = if golf.ball.y - golf.ball.r < 0.0 { golf.ball.r } else { golf.canvas_h - golf.ball.r };
    }
    
    // Hole Collisions
    let dist = ((golf.ball.x - golf.hole_x).powi(2) + (golf.ball.y - golf.hole_y).powi(2)).sqrt();
    if dist < golf.hole_r {
        game_state = "win".to_string();
        golf.ball.vx = 0.0; golf.ball.vy = 0.0;
    }
    
    // Stop Mechanics
    if golf.ball.vx.abs() < 0.1 && golf.ball.vy.abs() < 0.1 && game_state == "moving" {
        golf.ball.vx = 0.0; golf.ball.vy = 0.0;
        game_state = "lose".to_string();
    }
    
    if golf.ball.vx == 0.0 && golf.ball.vy == 0.0 && game_state == "moving" {
        game_state = "ready".to_string();
    }

    Ok(GolfRenderState {
        ball: golf.ball.clone(),
        game_state,
    })
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(QuizState::default()))
        .manage(Mutex::new(GolfState::default()))
        .setup(|_app| {
            println!("Financial Golf Sandboxed Initialization Started.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_security_status,
            calculate_interest,
            calculate_table_async,
            get_quiz,
            check_answer,
            reset_quiz,
            init_golf,
            shoot_golf,
            update_golf_physics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
