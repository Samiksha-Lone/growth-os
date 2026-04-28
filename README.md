# GrowthOS — Personal Growth & Productivity Platform

> A full-stack MERN application designed to help users track their personal growth through tasks, habits, reflections, and data-driven insights.

## 🔗 Links
- **Live Demo**: [https://growth-os-chi.vercel.app](https://growth-os-chi.vercel.app)
- **GitHub Repository**: [https://github.com/Samiksha-Lone/growth-os](https://github.com/Samiksha-Lone/growth-os)

## Overview

GrowthOS is a comprehensive personal productivity and growth tracking platform that empowers users to build better habits, manage tasks effectively, and gain insights from their daily progress patterns. It combines modern productivity techniques like the Pomodoro method with comprehensive analytics to help users understand their patterns and optimize their performance.

## Problem Statement

- **Fragmented Productivity Tools**: Users struggle with multiple disjointed applications to track tasks, habits, and progress.
- **Lack of Actionable Insights**: Limited understanding of personal patterns and productivity trends without meaningful data analysis.
- **No Unified Growth Tracking**: Difficulty in correlating mood, productivity, and task completion to identify improvement areas.

## Solution

GrowthOS provides a centralized platform that consolidates all aspects of personal growth tracking. It combines task management, habit tracking, mood logging, and data-driven analytics to give users a holistic view of their progress and actionable recommendations for improvement.

## Key Features

- 🔐 **Secure Authentication** — JWT-based user authentication with password hashing and token authorization
- 📋 **Task Management** — Create, organize, and track tasks by priority and category (Work/Study/Health/Personal)
- 🔄 **Habit Tracking** — Build habits with streak counters and completion tracking
- 📝 **Daily Reflections** — Log mood, productivity scores, and personal learnings
- 💡 **Data-Driven Insights** — Pattern analysis with task trends, habit streaks, mood analysis, and recommendations
- 📊 **Advanced Analytics** — Statistics on completion rates, task trends, habit consistency, and productivity metrics
- ⏱️ **Pomodoro Timer** — Focus sessions with automatic tracking and analytics
- 🎯 **Goals & Affirmations** — Set and track personal goals and affirmations
- 🧠 **Reality Checks** — Daily analysis of planned vs. completed tasks
- 📈 **Dashboard** — Real-time overview of progress, habits, and performance
- 📱 **Responsive UI** — Mobile-optimized design with smooth animations
- 📜 **History Page** — View historical data and past activities

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, Tailwind CSS, React Query, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Auth & Security** | JWT, bcryptjs, Helmet.js, express-rate-limit |
| **Analytics** | Data aggregation, pattern analysis, trend visualization |
| **Email** | Nodemailer (SMTP) |
| **Deployment** | Vercel (frontend), Render (backend) |

## Architecture / Flow

```text
User → React Frontend → Axios → Express API → MongoDB
                                      ↓
                           JWT Auth · Rate Limiting
                           Nodemailer · Business Logic
```

## My Contribution

**I independently designed and built this entire project from scratch**, including:

- 🖥️ **Frontend** — All React components, routing, state management, and responsive UI
- ⚙️ **Backend** — Express server, RESTful APIs, MongoDB schemas, and business logic
- 📊 **Analytics & Insights** — Data aggregation, pattern analysis, and insight generation
- 🔐 **Authentication** — Secure user authentication flows and authorization middleware
- 🚀 **Deployment** — Environment setup, MongoDB Atlas integration, and full-stack deployment

## Setup

### Prerequisites
Node.js 18+, npm, MongoDB Atlas account

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=mongodb+srv://<your-cluster>
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev   # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
VITE_API_BASE=http://localhost:5000/api
```

```bash
npm run dev   # http://localhost:5173
```

## Screenshots

### Dashboard
![Dashboard](outputs/dashboard.webp)

### Planner
![Habits](outputs/planner.webp)

### Reflections
![Insights](outputs/reflection.webp)

### Analytics
![Analytics](outputs/analytics.webp)

## Future Improvements

- [ ] Social features for sharing progress with friends
- [ ] Advanced machine learning models for predictive analytics
- [ ] Integration with third-party productivity tools (Notion, Slack)
- [ ] Mobile native app for iOS and Android
- [ ] Customizable dashboard widgets

## License

ISC License — see [LICENSE](LICENSE) for details.

## Credits

**Developed by [Samiksha Lone](https://github.com/Samiksha-Lone)**

## Credit

**Samiksha Lone**  
[GitHub Profile](https://github.com/Samiksha-Lone)