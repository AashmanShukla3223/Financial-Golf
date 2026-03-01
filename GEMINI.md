# Financial Golf Project Context

## Project Overview
Financial Golf is an educational desktop application focused on money management, budgeting, and investing. It is built as a secure, high-performance multi-language micro-architecture application using **Tauri (Rust)** for the backend and a **Vanilla HTML/CSS/TypeScript** frontend.

The application features:
- **Financial Tools:** Compound interest calculator and budgeting tables.
- **Educational Quiz:** A daily financial quiz with answers securely hashed using SHA-256 in the Rust backend to prevent cheating.
- **Hidden Minigame:** A 2D physics-based golf game embedded within the app, activated by a secret Konami code on the keyboard. The physics engine is natively powered by Rust.
- **UI/UX:** A modern Glassmorphism design system using vanilla CSS and the Outfit font family.
- **Security:** Strict file-system isolation through Tauri to prevent unauthorized access.

## Architecture & Technologies
- **Frontend (`ui/`):** 
  - HTML5, Vanilla CSS3 (`index.css`), and TypeScript (`main.ts` compiled to `main.js`).
  - Uses the Tauri API (`window.__TAURI__`) for invoking Rust commands and listening to asynchronous events.
- **Backend (`src-tauri/`):** 
  - Rust with the Tauri 1.x framework.
  - Exposes commands via IPC for math calculations (`calculate_interest`, `calculate_table_async`), quiz state (`get_quiz`, `check_answer`), and game physics (`init_golf`, `update_golf_physics`).
  - Uses `ts-rs` for generating TypeScript bindings from Rust structs to ensure type safety between the frontend and backend.
- **CI/CD:** GitHub Actions workflow (`.github/workflows/build.yml`).

## Building and Running
The project uses `npm` for frontend dependencies/scripts and `cargo`/`tauri-cli` for the Rust backend.

**Key Commands:**
- **Development Mode:** `npm run tauri dev` (Starts the application in development mode with hot-reloading).
- **Build Frontend:** `npm run build` (Runs `tsc` to compile TypeScript into JavaScript).
- **Build App:** `npm run tauri build` (Compiles the final release binaries).

## Development Conventions
- **Frontend Logic:** Kept lightweight. All heavy computations, secure validations, and physics updates are offloaded to the Rust backend.
- **Event-Driven IPC:** The app heavily uses Tauri's `invoke` for synchronous/asynchronous command execution and `listen`/`emit_all` for background task updates (e.g., table calculations).
- **Rust Error Handling:** Centralized error formatting is used in Rust (`format_err`).
- **State Management:** Rust uses `tauri::State` with `std::sync::Mutex` to manage thread-safe application state for the Quiz and Golf minigame.
- **Type Safety:** Ensure any new Rust structs shared with the frontend derive `TS` (from `ts-rs`) and are exported to the `ui/bindings/` folder.
