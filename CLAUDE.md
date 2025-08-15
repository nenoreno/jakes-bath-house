# Jake's Bath House - Claude Memory

## Project Overview
Jake's Bath House is a full-stack mobile-first web application for pet grooming and self-service wash booking, built for a real business in Royal Palm Beach, Florida.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, WebSocket client
- **Backend**: Go (Gin framework), WebSocket hub, bcrypt authentication
- **Database**: PostgreSQL with Docker Compose
- **Real-time**: WebSocket connections for live appointment updates

## Key Features
- Mobile-responsive design with bottom tab navigation
- User authentication and registration
- Pet management system
- Appointment booking with real-time status updates
- Rewards system (every 5th visit free)
- WebSocket real-time broadcasting
- Admin dashboard functionality

## Project Structure
```
jakes-bath-house/
├── frontend/          # React app (port 3000)
├── backend/           # Go API server (port 8081)
├── database/          # PostgreSQL setup & migrations
└── README.md         # Comprehensive documentation
```

## Development Commands
- **Database**: `cd database && docker-compose up -d`
- **Backend**: `cd backend && go run main.go`
- **Frontend**: `cd frontend && npm run dev`

## Database Schema
- users, pets, services, appointments (with real-time status)
- rewards tracking, appointment history
- notification preferences, status updates

## Current Status
✅ Complete core functionality with real-time features
🔄 Future: Payment integration, admin dashboard, SMS notifications

## Demo Account
- Email: ant@cheese.com
- Password: password123

## Business Context
Real application for Jake's Bath House (606 Royal Palm Beach Blvd, FL)
- Self-service DIY wash stations
- Professional grooming by appointment
- Family-owned business serving pet owners

## Recent Enhancements (Aug 2025)
- WebSocket real-time appointment updates
- Enhanced status tracking and broadcasting
- Database migrations for new features
- Improved error handling and logging
- 2 GO