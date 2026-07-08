# CreditPulse — AI-Powered MSME Financial Health & Credit Intelligence Platform
### (IDBI Innovate 2026 — Track 03: Financial Health Score)

CreditPulse is an enterprise-grade underwriting and credit intelligence platform that enables banks to evaluate Micro, Small & Medium Enterprises (MSMEs) using rich alternate data streams. It aggregates real-time records from GST filings, UPI merchant streams, Account Aggregator bank summaries, and EPFO payroll logs to compute a multidimensional **Financial Health Score**, visualizes strengths and risk factors via Explainable AI, and provides a conversational virtual CFO assistant powered by Google Gemini.

---

## 🏗️ Architecture & Project Structure
This repository is configured as a single-package project containing both the React 18 frontend and the Node.js Express backend, making local deployment seamless.

```
/
├── package.json               # Combined script ledger and dependencies
├── vite.config.ts             # Vite server with reverse proxy (/api to port 5500)
├── tailwind.config.js          # Brand guidelines: Forest Green (#0B6E4F), Saffron Orange (#F26522)
├── index.html                 # HTML mounting template
├── .env                       # Environment settings (port, Gemini API key)
├── src/                       # React Frontend SPA (TypeScript)
│   ├── main.tsx
│   ├── index.css              # Custom font bindings, animations, glassmorphism CSS
│   ├── App.tsx                # Layout shell, navigation router, dark mode, CFO drawer
│   ├── types/                 # Ledger, score, and RM action models
│   ├── components/            # Shared components (ExplainabilityCard, CopilotChat)
│   └── features/              # Feature modules (PitchScreen, Overview, RMDashboard, WhatIf, etc.)
└── server/                    # Node.js Express Backend
    ├── index.ts               # Express Router APIs
    ├── db.ts                  # File database controller & 27 detailed MSME seeds
    ├── scoring.ts             # Pillar Normalization & Weighted Math Score Engine
    ├── copilot.ts             # Gemini API Integration & fallback CFO advisor
    └── pdf.ts                 # Executive rating-agency style report compiler
```

---

## ⚡ Technical Core & scoring Engine
Credit evaluates MSMEs across 5 operational pillars, bypassing traditional audited document reliance:

| Pillar | Weight | Underlying Signals |
|---|---|---|
| **Revenue Stability** | 25% | Monthly GST GSTR-3B filing volumes, growth curves, cyclical variances |
| **Cash Flow Health** | 25% | Bank statement Inflow/Outflow ratio, average ledger balance, ECS bounces |
| **Compliance** | 20% | GSTR-3B filing delays (days late), EPFO registration, payment timeliness |
| **Business Stability** | 15% | Registered vintage (years operational), active workforce headcount trend |
| **Repayment Capacity** | 15% | Net cash surplus ratio (Inflow - Outflow)/Outflow, active EMI burdens |

### 🔍 Explainable AI & CFO Assistant
1. **Explainable AI (XAI)**: Clicking on any spoke or metric triggers the `<ExplainabilityCard />`, displaying the exact point impact (e.g. `ECS Cheque Bounces: -15 points`) along with confidence indexes.
2. **AI CFO ("CFO Copilot")**: Powered by Google Gemini (via `@google/generative-ai`), this chatbot is grounded in the target MSME's data, explaining risks, calculating runways, suggesting government schemes (e.g. Mudra, CGTMSE), and formatting improvement plans.

---

## 🔌 API Adapter Blueprint (Production Map)
The simulated database seeding adapters are designed to map directly to live production APIs:
1. **GST Connect**: Maps to official **GSTN Sandbox APIs** (e.g., `/taxpayer/search` to fetch profile, and GSTR-3B `/returns` ledger streams).
2. **Account Aggregator**: Maps to **Sahamati DEPA architecture** consent requests. The Node backend would issue a Consent Request XML, direct the user to redirect URLs, and pull bank aggregates in FIP JSON format.
3. **EPFO Connect**: Maps to unified **Shram Suvidha Portal API** integrations verifying payroll deposits.
4. **UPI Merchant QR**: Syncs with commercial acquiring banks' transaction webhooks (e.g., PhonePe, GooglePay merchant portals).

---

## 🚀 Local Run Instructions

### Prerequisites
* **Node.js** (v18.x or above recommended)
* **NPM** (v9.x or above)

### Setup & Launch
1. Clone or unpack the project folder.
2. Open terminal inside the root folder: `c:\Users\Asus\OneDrive\Desktop\IDBI Hackathon`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure Gemini API Key:
   Open the `.env` file at the root and insert your key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_key_here
   ```
   *(Note: If left blank or missing, the platform automatically utilizes a local rule-based CFO advisor, ensuring the demo works out-of-the-box.)*
5. Launch frontend and backend concurrently:
   ```bash
   npm run dev
   ```
6. Access the dashboard:
   Open your browser to `http://localhost:3500` (which reverse proxies `/api` calls to port `5500`).

---

## 🖥️ Hackathon Demo Sequence (Run in 2 mins)
1. **Pitch Mode**: Present the hook (rejections, credit-invisibles, alternative data).
2. **Launch Dashboard**: Enter the banking hub.
3. **Cinematic Demo Mode**: Click `/demo` and run the script. It animates the live GST/AA/UPI/EPFO sync pipelines, reveals the score count-up, assessments, and compiles the ratings report.
4. **RM ledger**: Select an MSME (e.g. *Kalyan Groceries*), inspect GST trends, click any radar spoke to show the AI explainability card, and toggle the CFO chat to ask *"How to improve score?"*.
5. **What-If Simulator**: Slide the GST Compliance or Bounces parameters to show immediate score and borrowing capacity recalibrations.
6. **Executive PDF**: Generate and print/save the CRISIL-style credit assessment.
