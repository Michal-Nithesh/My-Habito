# Habito - Web-Based Habit Tracker

A modern, full-featured web application inspired by Loop Habit Tracker, built with React, FastAPI, and Supabase.

## 🎯 Overview

Habito is a complete rewrite of Loop Habit Tracker for the web, featuring:
- ✅ Habit creation and management
- ✅ Flexible scheduling (daily, weekly, custom frequencies)
- ✅ Habit check-ins and repetitions
- ✅ Automatic streak calculation
- ✅ Habit strength scoring
- ✅ Statistics and charts
- ✅ Dark mode support
- ✅ Multi-language support
- ✅ Data export (CSV)
- ✅ Real-time synchronization

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Zustand
- **Backend**: Python 3.11+ + FastAPI + Pydantic
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Frontend) + Render/AWS (Backend) + Supabase (Database)

### Project Structure
```
habito/
├── frontend/                 # React TypeScript application
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand state management
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── i18n/            # Internationalization
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # FastAPI Python application
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── v1/
│   │   │   │   ├── habits.py
│   │   │   │   ├── repetitions.py
│   │   │   │   ├── streaks.py
│   │   │   │   ├── scores.py
│   │   │   │   ├── statistics.py
│   │   │   │   └── export.py
│   │   │   └── router.py
│   │   ├── core/            # Core configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic
│   │   │   ├── habit_service.py
│   │   │   ├── streak_calculator.py
│   │   │   ├── score_calculator.py
│   │   │   └── statistics_service.py
│   │   ├── schemas/         # Request/Response schemas
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/                 # Database schemas and migrations
│   ├── schema.sql
│   ├── migrations/
│   └── seed.sql
│
└── docs/                     # Documentation
    ├── API.md
    ├── DEPLOYMENT.md
    └── ARCHITECTURE.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free tier)
- Git

### 5-Minute Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/habito.git
cd habito

# 2. Set up Supabase database
# - Create project at https://supabase.com
# - Run database/schema.sql in Supabase SQL Editor

# 3. Start backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your Supabase credentials
uvicorn app.main:app --reload

# 4. Start frontend (in new terminal)
cd frontend
npm install
cp .env.example .env.local  # Edit with your Supabase credentials
npm run dev
```

Open `http://localhost:5173` in your browser!

### Docker Setup

```bash
# Create .env file with your Supabase credentials in project root
docker-compose up -d
```

### 📚 Full Documentation

- **[📖 Setup Guide](docs/SETUP.md)** - Complete local development setup
- **[📚 API Documentation](docs/API.md)** - All API endpoints with examples
- **[🏗️ Architecture](docs/ARCHITECTURE.md)** - System design and data flow
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment (Vercel + Render + Supabase)

## 🛠️ Detailed Setup

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn app.main:app --reload
```

### Database Setup
1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `database/schema.sql` in the Supabase SQL editor
3. Configure Row Level Security (RLS) policies

## 📊 Database Schema

### Main Tables
- `users` - User accounts (managed by Supabase Auth)
- `habits` - Habit definitions and settings
- `repetitions` - Habit check-ins and completions
- `streaks` - Calculated streak data
- `scores` - Calculated habit strength scores
- `reminders` - Habit reminder settings

## 🔌 API Endpoints

### Habits
- `GET /api/v1/habits` - List all habits
- `POST /api/v1/habits` - Create a new habit
- `GET /api/v1/habits/{id}` - Get habit details
- `PUT /api/v1/habits/{id}` - Update a habit
- `DELETE /api/v1/habits/{id}` - Delete a habit

### Repetitions
- `GET /api/v1/repetitions` - List repetitions
- `POST /api/v1/repetitions` - Record a check-in
- `PUT /api/v1/repetitions/{id}` - Update a check-in
- `DELETE /api/v1/repetitions/{id}` - Delete a check-in

### Statistics
- `GET /api/v1/statistics/habits/{id}` - Get habit statistics
- `GET /api/v1/statistics/overview` - Get user overview

### Export
- `GET /api/v1/export/csv` - Export all data as CSV
- `GET /api/v1/export/habits/{id}/csv` - Export specific habit

## 🎨 Features Ported from Loop Habit Tracker

### Core Features
✅ Habit creation with name, description, color, and icon
✅ Flexible frequency settings (e.g., "3 times per week")
✅ Custom weekly schedules (specific days)
✅ Boolean and numerical habit types
✅ Habit check-ins with notes and timestamps
✅ Automatic streak calculation
✅ Habit strength scoring algorithm
✅ Archive and restore habits

### Analytics
✅ History charts (daily, weekly, monthly views)
✅ Frequency charts
✅ Streak charts
✅ Score evolution charts
✅ Calendar view with color coding

### User Experience
✅ Dark mode support
✅ Responsive design (mobile, tablet, desktop)
✅ Drag-and-drop habit reordering
✅ Quick check-in from home screen
✅ Habit filtering and search
✅ Multi-language support

## 🔐 Authentication

Authentication is handled entirely by Supabase Auth:
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic link login
- Session management
- Row Level Security (RLS)

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render/AWS/Railway)
```bash
cd backend
# Configure environment variables
# Deploy using platform-specific commands
```

### Environment Variables

#### Frontend (.env.local)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_api_url
```

#### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_postgres_url
SECRET_KEY=your_secret_key
```

## 📖 Documentation

Full documentation available in `docs/`:

- **[📖 SETUP.md](docs/SETUP.md)** - Complete local development setup guide
- **[📚 API.md](docs/API.md)** - All API endpoints, request/response examples, error codes
- **[🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, data flow, component design
- **[🚀 DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment to Vercel/Render/AWS/Supabase

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📄 License

This project is inspired by Loop Habit Tracker (GPLv3) and is released under the MIT License.

## 🙏 Acknowledgments

- [Loop Habit Tracker](https://github.com/iSoron/uhabits) - Original Android app
- Supabase - Backend-as-a-Service platform
- FastAPI - Modern Python web framework
- React - Frontend library
