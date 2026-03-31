

# Connect & Grow – Smart Mobile AI Banking
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.5-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3.0%2B-003B57?logo=sqlite&logoColor=white)


## Overview

**Connect & Grow** is an AI-powered digital banking extension developed during the Raiffeisen Internship Think Tank Lab 2026.

The platform transforms traditional banking from **passive transaction tracking** into an **interactive, intelligent financial experience**, combining:

- AI-driven transaction understanding  
- Personalized financial insights  
- A social community layer for financial growth  

👉 Instead of just showing data, the system helps users **understand, act, and improve their financial behavior**.

---

## Problem

Current banking applications:

- Provide raw data, but **no real interpretation**
- Do not clearly explain **where money actually goes**
- Lack **personalized insights and guidance**
- Offer **no proactive support**
- Do not help users make **better financial decisions**

---

## Solution

We introduce a system that combines **AI + Banking + Community**:

- AI analyzes transactions and extracts meaningful insights  
- Users can ask questions in natural language  
- Financial behavior becomes visible and understandable  
- Community interaction increases motivation and engagement  

💡 *We combine intelligent banking with the power of an active community.*

---

## Core Features

### 1. Intelligent Financial Chat

- Ask questions like:
  - *“Where do I spend most of my money?”*
  - *“How often do I go to Starbucks?”*
- Understand spending behavior instantly
- Works in **Romanian + English**



### 2. Merchant Intelligence System

- Cleans and normalizes noisy POS data
- Detects the **real merchant behind transactions**
- Builds a **merchant profile**:
  - frequency
  - average spending
  - last interaction
- Detects anomalies (unusual amounts or behavior)



### 3. Spending Heatmap (Security + Insights)

- Visual map of transactions
- Detect unusual locations instantly
- Helps identify fraud or suspicious behavior
- Enables geographic spending analysis



### 4. Community Layer

- Connect users with similar financial habits
- Share experiences and recommendations
- Create groups (saving, lifestyle, investing)
- Invite friends (WhatsApp / Email)

💡 Drives **motivation, accountability, and organic growth**


## Business Impact

- Increased user engagement  
- Higher transaction volume  
- Stronger customer retention  
- Organic user acquisition through community  

👉 More users → more activity → more opportunities for banking services

---

## Tech Architecture

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts, Leaflet

### Backend
- Python (AI services)
- FastAPI-style architecture
- SQLite database

### AI Layer
- OpenAI API integration
- NLP for intent parsing
- Merchant normalization
- Safety filtering

---

## System Workflow

1. Define requirements & architecture  
2. Build frontend UI/UX  
3. Develop backend services  
4. Integrate AI (OpenAI)  
5. Test & validate flows  
6. Deploy (CI/CD ready)

---

## Future Improvements

### Banking
- Real-time anomaly notifications  
- Direct integration with university systems (fees, dorm, cafeteria)  
- Scholarship payments inside the app  

### Community
- AI-based group recommendations  
- Smart connections based on spending behavior  

---

## How To Run

### Frontend

```bash
cd frontend
npm install
npm run dev
