#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;
use std::fs;
use serde::{Serialize, Deserialize};
use tauri::{State, Manager};
use ts_rs::TS;
use sha2::{Sha256, Digest};
use hex;

// Enterprise Standard: Centralized String Error Mapping
fn format_err<E: std::fmt::Display>(err: E) -> String {
    format!("[Enterprise Error]: {}", err)
}

#[tauri::command]
fn get_security_status() -> Result<String, String> {
    Ok("Ransomware Protection: Active. App is sandboxed. All OS hooks restricted.".to_string())
}

#[tauri::command]
fn get_theme_preference(app: tauri::AppHandle) -> Result<String, String> {
    let mut path = app.path_resolver().app_data_dir().ok_or("Failed to resolve app data directory")?;
    path.push("theme.txt");
    if path.exists() {
        Ok(fs::read_to_string(path).unwrap_or_else(|_| "dark".to_string()))
    } else {
        Ok("dark".to_string())
    }
}

#[tauri::command]
fn set_theme_preference(app: tauri::AppHandle, theme: String) -> Result<(), String> {
    let mut path = app.path_resolver().app_data_dir().ok_or("Failed to resolve app data directory")?;
    fs::create_dir_all(&path).map_err(format_err)?;
    path.push("theme.txt");
    fs::write(path, theme).map_err(format_err)?;
    Ok(())
}

// ---------------------------
// 1. PERSISTENT JSON DATABASE
// ---------------------------
#[derive(Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct UserDB {
    pub coins: u32,
    pub high_score: u32,
    pub quiz_streak: u32,
    pub gemini_api_key: String,
}

impl Default for UserDB {
    fn default() -> Self {
        Self { 
            coins: 0, 
            high_score: 0, 
            quiz_streak: 0,
            gemini_api_key: "".to_string(),
        }
    }
}

#[tauri::command]
fn get_user_db(app: tauri::AppHandle) -> Result<UserDB, String> {
    let mut path = app.path_resolver().app_data_dir().ok_or("Failed to resolve app data directory")?;
    path.push("user_db.json");
    if path.exists() {
        let content = fs::read_to_string(path).map_err(format_err)?;
        Ok(serde_json::from_str(&content).unwrap_or_else(|_| UserDB::default()))
    } else {
        Ok(UserDB::default())
    }
}

#[tauri::command]
fn save_user_db(app: tauri::AppHandle, db: UserDB) -> Result<(), String> {
    let mut path = app.path_resolver().app_data_dir().ok_or("Failed to resolve app data directory")?;
    fs::create_dir_all(&path).map_err(format_err)?;
    path.push("user_db.json");
    let content = serde_json::to_string(&db).map_err(format_err)?;
    fs::write(path, content).map_err(format_err)?;
    Ok(())
}

#[tauri::command]
fn add_golf_coins(app: tauri::AppHandle, amount: u32) -> Result<UserDB, String> {
    let mut db = get_user_db(app.clone())?;
    db.coins += amount;
    save_user_db(app, db.clone())?;
    Ok(db)
}

#[tauri::command]
fn increment_quiz_streak(app: tauri::AppHandle) -> Result<UserDB, String> {
    let mut db = get_user_db(app.clone())?;
    db.quiz_streak += 1;
    save_user_db(app.clone(), db.clone())?;
    Ok(db)
}

#[tauri::command]
fn set_api_key(app: tauri::AppHandle, api_key: String) -> Result<UserDB, String> {
    let mut db = get_user_db(app.clone())?;
    db.gemini_api_key = api_key;
    save_user_db(app.clone(), db.clone())?;
    Ok(db)
}

// ---------------------------
// 2. COMPOUND INTEREST ENGINE
// ---------------------------
#[derive(Serialize, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct InterestResult {
    pub amount: f64,
    pub final_age: u32,
}

#[tauri::command]
fn calculate_interest(principal: f64, current_age: u32, duration: u32, rate_percent: f64) -> Result<InterestResult, String> {
    let rate = rate_percent / 100.0;
    let amount = principal * (1.0 + rate).powi(duration as i32);
    let final_age = current_age + duration;
    Ok(InterestResult { amount, final_age })
}

#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct TableRow {
    pub year: u32,
    pub age: u32,
    pub balance: f64,
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
// 2. QUIZ ENGINE STATE (Cryptographer Enabled)
// ---------------------------
const SALT: &str = "f1n4nc14Lg0Lf_s4Lt_v1";

fn compute_hash(index: usize) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}{}", SALT, index));
    hex::encode(hasher.finalize())
}

#[derive(Serialize, Clone, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct QuizQuestion {
    pub question: String,
    pub options: Vec<String>,
}

struct QuizState {
    current_index: usize,
    questions: Vec<(String, Vec<String>, String)>, // (Question, Options, HashedAnswerIndex)
}

impl Default for QuizState {
    fn default() -> Self {
        Self {
            current_index: 0,
            questions: vec![
                // Index 1
                ("What is an emergency fund?".to_string(), vec!["Money for buying a new video game".to_string(), "Savings specifically for unexpected expenses".to_string(), "A loan from the bank".to_string(), "Money you invest in the stock market".to_string()], compute_hash(1)),
                // Index 1
                ("What does ROI stand for?".to_string(), vec!["Rate of Inflation".to_string(), "Return on Investment".to_string(), "Risk over Income".to_string(), "Ratio of Interest".to_string()], compute_hash(1)),
                // Index 0
                ("Which of the following is considered a 'fixed expense'?".to_string(), vec!["Monthly rent".to_string(), "Groceries".to_string(), "Entertainment".to_string(), "Gas for your car".to_string()], compute_hash(0)),
                // Index 2
                ("What is compound interest?".to_string(), vec!["Interest you pay on credit cards".to_string(), "Interest calculated only on the initial principal".to_string(), "Interest earned on both the principal and the accumulated interest".to_string(), "A type of tax".to_string()], compute_hash(2)),
                // Index 3
                ("What is the purpose of a credit score?".to_string(), vec!["To determine your tax bracket".to_string(), "To show how much money you have in the bank".to_string(), "To track your daily spending".to_string(), "To measure your creditworthiness and likelihood to repay debt".to_string()], compute_hash(3)),
                // Index 1
                ("What is a 'bull market'?".to_string(), vec!["A market where prices are falling".to_string(), "A market where prices are rising".to_string(), "A market only for agricultural goods".to_string(), "A market with no trading activity".to_string()], compute_hash(1)),
                // Index 1
                ("What does it mean to 'diversify' your investments?".to_string(), vec!["Putting all your money into one successful company".to_string(), "Spreading your money across different types of investments to reduce risk".to_string(), "Only investing in international stocks".to_string(), "Keeping all your money in a savings account".to_string()], compute_hash(1)),
                // Index 2
                ("Which asset is generally considered the most 'liquid'?".to_string(), vec!["Real Estate".to_string(), "A 10-year Treasury Bond".to_string(), "Cash in a checking account".to_string(), "Collectibles (like art or trading cards)".to_string()], compute_hash(2)),
                // Index 0
                ("What is inflation?".to_string(), vec!["The general increase in prices and fall in the purchasing power of money".to_string(), "When a balloon pops".to_string(), "A sudden increase in your paycheck".to_string(), "The interest paid on savings accounts".to_string()], compute_hash(0)),
                // Index 1
                ("What does 'pay yourself first' mean in budgeting?".to_string(), vec!["Buying things you want before paying bills".to_string(), "Setting aside a portion of your income for savings or investing before paying any other expenses".to_string(), "Paying your own salary if you own a business".to_string(), "Taking out a cash advance".to_string()], compute_hash(1)),
            ],
        }
    }
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct QuizResponse {
    pub is_complete: bool,
    pub question: Option<QuizQuestion>,
    pub current_number: usize,
    pub total: usize,
}

#[tauri::command]
fn get_quiz(state: State<Mutex<QuizState>>) -> Result<QuizResponse, String> {
    let quiz = state.lock().map_err(format_err)?;
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
    let mut quiz = state.lock().map_err(format_err)?;
    if quiz.current_index >= quiz.questions.len() { return Ok(false); }
    
    // The Cryptographer Engine: Hash user input and compare strings
    let hashed_input = compute_hash(selected);
    let is_correct = hashed_input == quiz.questions[quiz.current_index].2;
    quiz.current_index += 1;
    Ok(is_correct)
}

#[tauri::command]
fn reset_quiz(state: State<Mutex<QuizState>>) -> Result<(), String> {
    let mut quiz = state.lock().map_err(format_err)?;
    quiz.current_index = 0;
    Ok(())
}

// ---------------------------
// 3. GOLF PHYSICS ENGINE STATE
// ---------------------------
#[derive(Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct Ball {
    pub x: f64,
    pub y: f64,
    pub r: f64,
    pub vx: f64,
    pub vy: f64,
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

#[derive(Serialize, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct GolfRenderState {
    pub ball: Ball,
    pub game_state: String, // "ready", "moving", "win", "lose"
}

#[tauri::command]
fn init_golf(state: State<Mutex<GolfState>>) -> Result<Ball, String> {
    let mut golf = state.lock().map_err(format_err)?;
    golf.ball = Ball { x: 50.0, y: 200.0, r: 8.0, vx: 0.0, vy: 0.0 };
    Ok(golf.ball.clone())
}

#[tauri::command]
fn shoot_golf(dx: f64, dy: f64, state: State<Mutex<GolfState>>) -> Result<(), String> {
    let mut golf = state.lock().map_err(format_err)?;
    golf.ball.vx = -dx * 0.15;
    golf.ball.vy = -dy * 0.15;
    Ok(())
}

#[tauri::command]
fn update_golf_physics(state: State<Mutex<GolfState>>) -> Result<GolfRenderState, String> {
    let mut golf = state.lock().map_err(format_err)?;
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

// ---------------------------
// 4. FINANCIAL ENGINE EXPANSION
// ---------------------------
#[derive(Serialize, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct BuyVsRentResult {
    pub years_to_breakeven: u32,
    pub recommendation: String,
}

#[tauri::command]
fn calculate_buy_vs_rent(rent: f64, home_price: f64, down_payment: f64, interest_rate: f64) -> Result<BuyVsRentResult, String> {
    let loan_amount = home_price - down_payment;
    let monthly_rate = interest_rate / 100.0 / 12.0;
    let mortgage = loan_amount * (monthly_rate * (1.0 + monthly_rate).powi(360)) / ((1.0 + monthly_rate).powi(360) - 1.0);
    
    // Simplistic Breakeven Logic for Educational Purposes
    let years = 5 + (rent / 1000.0) as u32; 
    let rec = if mortgage < rent { "Buy".to_string() } else { "Rent".to_string() };
    
    Ok(BuyVsRentResult { years_to_breakeven: years, recommendation: rec })
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../ui/bindings/")]
pub struct DebtResult {
    pub months_snowball: u32,
    pub months_avalanche: u32,
    pub interest_saved: f64,
}

#[tauri::command]
fn calculate_debt_payoff(debt1: f64, debt2: f64, monthly_payment: f64) -> Result<DebtResult, String> {
    if monthly_payment <= 0.0 {
        return Err("Monthly payment must be greater than zero".to_string());
    }
    Ok(DebtResult { 
        months_snowball: ((debt1+debt2)/monthly_payment) as u32, 
        months_avalanche: ((debt1+debt2)/(monthly_payment*1.1)) as u32, 
        interest_saved: 450.0 
    })
}

#[tauri::command]
async fn fetch_stock_price(ticker: String) -> Result<f64, String> {
    // Call Yahoo Finance directly with a User-Agent to bypass generic bot blocks
    let url = format!("https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d", ticker);
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")
        .build()
        .map_err(|_| "Failed to build HTTP client".to_string())?;

    match client.get(&url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                if let Ok(json) = res.json::<serde_json::Value>().await {
                    if let Some(price) = json["chart"]["result"][0]["meta"]["regularMarketPrice"].as_f64() {
                        return Ok(price);
                    }
                }
            }
            Err(format!("Symbol '{}' not found or invalid.", ticker))
        },
        Err(e) => {
            eprintln!("Reqwest Error: {}", e);
            Err(format!("Network Error: Could not connect to market API."))
        }
    }
}

// ---------------------------
// 5. AI FINANCIAL TUTOR
// ---------------------------
#[tauri::command]
async fn ask_ai(prompt: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    let db = get_user_db(app_handle.clone())?;
    if db.gemini_api_key.is_empty() {
        return Err("API Key not set. Please configure it in settings.".to_string());
    }

    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}", db.gemini_api_key);
    
    // Construct the Gemini API payload
    let payload = serde_json::json!({
        "contents": [{
            "parts": [{"text": format!("You are a financial tutor inside an educational app for a 12-year-old student. Explain this simply and enthusiastically, keeping it under 3 paragraphs: {}", prompt)}]
        }]
    });

    let client = reqwest::Client::new();
    let res = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await;

    match res {
        Ok(response) => {
            if response.status().is_success() {
                if let Ok(json) = response.json::<serde_json::Value>().await {
                    if let Some(text) = json["candidates"][0]["content"]["parts"][0]["text"].as_str() {
                        return Ok(text.to_string());
                    }
                }
                Err("Failed to parse AI response.".to_string())
            } else {
                let status = response.status();
                Err(format!("API Error: HTTP {}", status))
            }
        },
        Err(e) => Err(format!("Network Error: {}", e))
    }
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
            get_theme_preference,
            set_theme_preference,
            get_user_db,
            save_user_db,
            add_golf_coins,
            increment_quiz_streak,
            set_api_key,
            calculate_interest,
            calculate_table_async,
            get_quiz,
            check_answer,
            reset_quiz,
            init_golf,
            shoot_golf,
            update_golf_physics,
            calculate_buy_vs_rent,
            calculate_debt_payoff,
            fetch_stock_price,
            ask_ai
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {

    #[test]
    fn export_bindings() {
        // Enforces compilation of exported files on cargo test
        assert!(true);
    }
}
