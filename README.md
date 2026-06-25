# EcoGuardian AI – IBM AI Powered Environmental Monitoring Platform

EcoGuardian AI is a sustainability platform that empowers citizens to report local environmental issues—such as illegal dumping, plastic waste, e-waste, water leaks, and air pollution—by uploading photos and descriptions.

The platform processes these submissions using advanced AI visual and textual analysis (supporting **Google Gemini Multimodal API**, **IBM Watsonx.ai**, or a local simulated fallback model), classifies the concern, assesses its ecological impact, determines its severity, and outlines actionable solutions.

It also features a full-screen interactive hazard map, a sustainability dashboard, a floating EcoBot chat assistant, and a gamified community rewards system (Green Points & Badges).

---

## 🛠️ Technology Stack

### Frontend
- **React.js & Vite** – Fast, module-based single-page application framework.
- **Tailwind CSS** – Custom-crafted dark glassmorphism layout and design system.
- **React Router** – Client-side path navigation.
- **React Leaflet & OpenStreetMap** – Interactive maps using dark cartography tiles.
- **Recharts** – Interactive responsive charts for monthly trends and distributions.
- **Axios** – Promise-based API requests to the Flask server.
- **Lucide React** – Clean and consistent iconography.

### Backend
- **Python Flask** – Micro-web server routing framework.
- **Flask-CORS** – Cross-Origin Resource Sharing handling.
- **Google Generative AI SDK** – Multimodal vision and chat capabilities via Gemini.
- **IBM Watsonx REST API** – Optional Watsonx / Granite models integration.
- **Python Dotenv** – Environment configuration manager.

### Database & Storage
- **Local SQLite / SQLite3** – Self-contained demo database with automated schema initialization.
- **Supabase Integration** – Production-ready PostgreSQL database and cloud storage wrapper.

---

## 🚀 Quick Start Guide

### Step 1: Set up the Python Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   py -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure keys in `.env` (optional). If left blank, the platform operates in **offline/demo mode** using a local SQLite database and a rule-based simulated analyzer:
   ```env
   # Inside backend/.env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Run the Flask development server:
   ```bash
   python app.py
   ```
   The backend will start running on `http://localhost:5000`.

---

### Step 2: Set up the React Frontend

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will start running on `http://localhost:3000`. Open `http://localhost:3000` in your web browser.

---

## 🧠 Core System Operations

### 1. Dual Execution Modes
- **Demo / Offline Mode (Default):** Zero configuration required. The app saves files to a local `uploads/` directory, writes records to `ecoguardian.db` via SQLite, and runs simulated AI vision.
- **Production Mode:** Add `SUPABASE_URL`, `SUPABASE_KEY` and `GEMINI_API_KEY` to `backend/.env`. The backend automatically migrates file uploads and records to Supabase, and queries Gemini models for image analysis.

### 2. Math Model: Eco Score
The platform groups coordinates by a grid of **1.1km²** (rounding latitude/longitude to 2 decimal places). Each zone starts with an Eco Score of **100**. Active reports deduct points based on threat level:
- 🔴 **Critical:** -25 points
- 🟠 **High:** -15 points
- 🟡 **Medium:** -8 points
- 🟢 **Low:** -3 points

Resolving an issue clears the penalty, restoring the neighborhood's Eco Score back toward **100**.

### 3. Gamified Rewards
- **Report Submission:** +50 Green Points, unlocks **Eco Sentinel** badge.
- **Issue Resolution:** +100 Green Points, unlocks **Zero Waste Hero** badge.
- Cumulative submissions unlock **Green Inspector** (5 reports) and **Nature Savior** (10 reports) badges.
