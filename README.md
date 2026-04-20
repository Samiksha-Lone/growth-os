# GrowthOS

GrowthOS is a personal productivity and self-awareness system designed to bridge the gap between planning and actual execution.

Instead of just helping users organize tasks, it focuses on understanding behavior — tracking execution, identifying patterns, and improving consistency through structured reflection and data-driven insights.

## 🔗 Links

- 🚀 **Live Demo**: [https://growth-os-chi.vercel.app/](https://growth-os-chi.vercel.app/)
- 💻 **GitHub Repository**: [https://github.com/Samiksha-Lone/growth-os](https://github.com/Samiksha-Lone/growth-os)

## Problem Statement

This project started from a simple problem: staying consistent is harder than planning. Most productivity tools help you organize tasks, but they don't help you understand your behavior. You can plan perfectly and still fail to execute. There is no clear system to track why tasks are missed, how habits form, or what patterns affect productivity. GrowthOS was built to solve this gap — by combining planning, tracking, reflection, and insights into a single structured system.

## Solution Overview

GrowthOS provides a comprehensive system for daily planning, real-time tracking, evening reflections, and long-term analytics. It enables users to set goals, monitor habits, analyze productivity patterns, and receive data-driven insights to improve consistency and performance over time.

## System Architecture

- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express.js and MongoDB (Mongoose)
- **State Management**: React Query (TanStack Query) for robust data synchronization
- **Visualization**: Recharts for interactive productivity trends and heatmaps
- **Authentication**: Secure JWT-based sessions with protected routing

## 🚀 Core Features

*   **📊 Personalized Dashboard**: A central hub to track daily progress, active habits, and focus metrics at a glance.
*   **📅 Daily Task Planner**: A simple yet effective planning tool to organize tasks by priority (High/Med/Low) and categories.
*   **🕰️ Task History**: A full timeline of all past activities, grouped by date to track growth over time.
*   **🕒 Focus Mode (Pomodoro)**: An integrated timer system to help maintain deep work sessions.
*   **🔄 Habit Tracker**: Build consistency with daily check-ins and streak monitoring.
*   **🧠 Statistical Insights**: Non-AI behavioral analysis that uses Z-scores and variance to identify your productivity patterns.
*   **📈 Progress Analytics**: Interactive charts and heatmaps to visualize weekly trends and efficiency.
*   **📝 Daily Reflection**: A structured journal to capture mood, lessons learned, and productivity blockers.
*   **⚖️ Reality Check**: A unique tool that compares your "Planned vs. Actual" performance to improve planning accuracy.
*   **📱 Mobile Responsive**: Fully optimized for mobile devices with a hamburger menu, touch-friendly interfaces, and responsive layouts.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Query, Recharts
- **Backend**: Node.js, Express.js, TypeScript, Mongoose
- **Database**: MongoDB
- **Styling**: Vanilla CSS + Tailwind CSS (Glassmorphism & Dark Mode)

## ⚙️ Installation / Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Samiksha-Lone/growth-os.git
   cd growthos
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   - Create `.env` files in both backend and frontend directories
   - Add `MONGODB_URI`, `JWT_SECRET` in backend
   - Add `VITE_API_URL` in frontend

4. **Run the application**
   ```bash
   # Backend (from /backend)
   npm run dev

   # Frontend (from /frontend)
   npm run dev
   ```

## 📸 Screenshots

![Dashboard Overview](outputs/dashboard.webp)

![Task Planner Interface](outputs/planner.webp)

![Reflection Journal](outputs/reflection.webp)

![Analytics Dashboard](outputs/analytics.webp)

## Key Highlights

- **Premium Aesthetics**: Dark-mode focused UI with modern typography and smooth micro-animations.
- **Data Integrity**: Statistical baselining for accurate progress tracking without relying on external AI APIs.
- **Execution Focused**: Designed specifically to bridge the "Planning-Execution" gap.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credit

**Samiksha Lone**  
[GitHub Profile](https://github.com/Samiksha-Lone)