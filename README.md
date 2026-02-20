# Financial Golf ⛳

Welcome to **Financial Golf**, a premier educational desktop application designed to teach students the fundamentals of money management, budgeting, and investing, all while keeping them engaged with interactive tools and hidden easter eggs.

## 🌟 Overview

Financial Golf is built with an absolute priority on **Security** and **Performance**, utilizing a state-of-the-art multi-language micro-architecture. It securely sandboxes operations to prevent unauthorized file system access or ransomware-like behavior while still delivering incredibly fast educational data to the user.

## ✨ Core Features

### 🔒 Zero-Trust Rust Sandbox
The core of the application is wrapped in a **Tauri (Rust)** container. This provides:
- **Strict File-System Isolation**: The app cannot read or write to arbitrary folders on the user's computer, preventing any ransomware attempts.
- **Inter-Process Communication (IPC)**: Securely manages and spawns our backend engines without exposing them to the internet.

### 🧮 High-Performance Python Math Engine
Financial calculations require precision. We utilize a dedicated **Python Sidecar** running locally to handle:
- **Compound Interest Simulations**: Accurately project wealth growth over time.
- **Budgeting Algorithms**: Core financial logic abstracted away from the UI for integrity.

### 🧠 Go Quiz Microservice
Education requires speed and concurrency. Our **Go Content Engine** serves:
- **Daily Financial Quizzes**: Fast, concurrent REST API delivering randomized questions about emergency funds, stocks, and personal finance rules.

### 🎨 Modern Glassmorphism UI
The user interface is built with vanilla HTML/CSS/JS, focusing on a **stunning, premium aesthetic**:
- Implements modern **glassmorphism** design principles.
- Responsive, dynamic grid layouts.
- Vibrant, engaging animations using the `Outfit` font family.

### 🤫 The Hidden "Golf" Minigame
What's an educational app without a little fun? Embedded deep within the application is a hidden Canvas-based 2D Golf game!
- **How to Unlock**: Use the classic Konami Code (`Up, Up, Down, Down, Left, Right, Left, Right, B, A`) on your keyboard while the app is focused to take a break and play a round of golf!

## ⚙️ Architecture details

- **Frontend**: HTML5, CSS3 (Glassmorphic Design), Vanilla JavaScript
- **App Wrapper**: Rust (Tauri 1.x)
- **Financial Backend**: Python 3 (Flask)
- **Quiz Backend**: Go (net/http)
- **CI/CD**: GitHub Actions (Zero-Local-Toolchain Cloud Compilation)

---
*Built securely for students to learn money management without the risk of system compromise.*
