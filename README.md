# 🐕 Jake's Bath House

A modern full-stack mobile application for pet grooming and self-service wash booking, built for Jake's Bath House in Royal Palm Beach, Florida.

## ✨ Features

- 📱 **Mobile-First Design** - Responsive web app that works like a native mobile app
- 🔐 **User Authentication** - Secure registration and login system
- 📅 **Appointment Booking** - Book professional grooming and DIY wash stations
- 🐾 **Pet Management** - Add and manage multiple pets per account
- 🏆 **Rewards System** - Earn points and get free washes after every 5 visits
- 📲 **Real-Time Updates** - Live WebSocket notifications when grooming status changes
- 💳 **Service Management** - Browse different grooming packages and pricing
- ⚡ **Enhanced Appointment Management** - Real-time status updates and live broadcasting
- 🔄 **Live Status Tracking** - Instant updates across all connected devices

## 🏗️ Tech Stack

### Frontend
- **React 18** with Hooks
- **Tailwind CSS** for styling
- **Vite** for fast development and building
- **Axios** for API communication
- **Lucide React** for icons
- **WebSocket Client** for real-time updates

### Backend  
- **Go (Golang)** with Gin framework
- **PostgreSQL** database
- **WebSocket Hub** for real-time broadcasting
- **bcrypt** for password hashing
- **RESTful API** design
- **CORS** enabled for cross-origin requests

### DevOps
- **Docker & Docker Compose** for database
- **Git** version control
- **Environment variables** for configuration

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Go](https://golang.org/) (v1.21 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nenoreno/jakes-bath-house.git
   cd jakes-bath-house
   ```

2. **Start the Database**
   ```bash
   cd database
   docker-compose up -d
   ```

3. **Run Database Migrations** (for enhanced features)
   ```bash
   # Connect to PostgreSQL and run the migration scripts
   docker exec -i jakes-bathhouse-db psql -U postgres -d jakes_bathhouse < migration.sql
   ```

4. **Setup Backend**
   ```bash
   cd ../backend
   go mod tidy
   go get github.com/gorilla/websocket
   go run main.go
   ```

5. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

6. **Open the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8081
   - WebSocket: ws://localhost:8081/ws
   - Database: localhost:5432

## 📱 Demo Account

Try the app with the demo account:
- **Email:** `ant@cheese.com`
- **Password:** `password123`

Or create your own account using the registration form!

## 🗂️ Project Structure

```
jakes-bath-house/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Go API server
│   ├── main.go             # Main server file
│   ├── go.mod              # Go dependencies
│   └── .env                # Environment variables
├── database/                 # PostgreSQL setup
│   ├── init.sql            # Database schema
│   ├── migration.sql       # Enhanced features migration
│   └── docker-compose.yml  # Database container
└── README.md
```

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgres://postgres:password123@localhost:5432/jakes_bathhouse?sslmode=disable
PORT=8081
```

## 🌟 Key Features Explained

### Authentication System
- Secure user registration and login
- Password hashing with bcrypt
- Session management with localStorage
- Protected routes and user context

### Real-Time WebSocket System
- **Live appointment updates** - Status changes broadcast instantly
- **Multi-client support** - Updates appear on all connected devices
- **Automatic reconnection** - Maintains connection stability
- **Real-time notifications** - Instant alerts for appointment changes

### Enhanced Appointment Management
- **Status tracking**: `pending` → `confirmed` → `in_progress` → `completed` → `cancelled`
- **Live status updates** broadcast to all connected clients
- **Appointment history** with change tracking
- **Conflict prevention** and validation

### Mobile App Experience
- Bottom tab navigation
- Card-based UI design
- Touch-friendly interactions
- Responsive design for all screen sizes

### Business Logic
- Service booking for DIY washes and professional grooming
- Rewards tracking (every 5th visit is free)
- Real-time appointment status management
- User profile and pet management

## 📊 Database Schema

The app uses PostgreSQL with the following main tables:
- **users** - Customer accounts and authentication
- **pets** - Pet profiles linked to users
- **services** - Available grooming services and pricing
- **appointments** - Booking records and status with real-time updates
- **rewards** - Points and reward tracking
- **appointment_history** - Track all appointment changes
- **notification_preferences** - User notification settings
- **appointment_status_updates** - Real-time status change log

## 🚧 Current Status

This is an active project built for Jake's Bath House. Current functionality includes:

✅ User authentication and registration  
✅ Mobile-responsive design  
✅ Service browsing and pricing display  
✅ Full appointment booking system  
✅ Real-time WebSocket updates  
✅ Enhanced appointment status management  
✅ Live broadcasting of appointment changes  
✅ Rewards progress tracking  

🔄 **In Development:**
- Payment processing integration
- Push notifications
- Admin dashboard for Jake's team
- Appointment rescheduling and cancellation
- SMS notifications

## 🎯 Future Enhancements

- **React Native Conversion** - Convert to native iOS/Android apps
- **Payment Integration** - Stripe/Square payment processing
- **Admin Dashboard** - Management interface for staff
- **SMS Notifications** - Text updates for appointment status
- **Photo Upload** - Before/after grooming photos
- **Calendar Integration** - Google Calendar sync
- **Review System** - Customer feedback and ratings

## 🆕 Latest Updates (August 2025)

### WebSocket Real-Time Features
- ✅ **Real-time appointment updates** - Live status changes across all devices
- ✅ **WebSocket connection management** - Automatic connection on login
- ✅ **Enhanced status tracking** - Complete appointment lifecycle management
- ✅ **Live broadcasting** - Instant notifications for appointment changes
- ✅ **Database enhancements** - Appointment history and change tracking

### Technical Improvements
- ✅ **Enhanced backend API** with WebSocket support
- ✅ **Improved error handling** and logging
- ✅ **Database migrations** for new features
- ✅ **Real-time client connectivity** 
- ✅ **Status validation** and constraint management

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login

### Appointments
- `GET /api/v1/users/:id/appointments` - Get user appointments
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/:id/status` - Update appointment status (with real-time broadcasting)

### WebSocket
- `WS /ws?user_id=:id` - Real-time updates connection

### Other
- `GET /api/v1/services` - Get available services
- `GET /api/v1/users/:id/pets` - Get user pets
- `GET /health` - Health check

## 🏢 About Jake's Bath House

Jake's Bath House is a family-owned pet grooming business located in Royal Palm Beach, Florida. We specialize in:

- **Self-Service DIY Wash Stations** - "You Wash, We Clean!"
- **Professional Grooming** - Expert care by appointment
- **Pet Accessories & Treats** - Complete pet care products

**Location:** 606 Royal Palm Beach Blvd, Royal Palm Beach, FL 33411  
**Phone:** (561) 812-3931  
**Hours:** Daily 10:00 AM - 6:00 PM

## 🤝 Contributing

This is a business application for Jake's Bath House. If you're interested in contributing or have suggestions, please reach out!

## 📝 License

This project is proprietary software developed for Jake's Bath House.

## 👨‍💻 Developer

Built with ❤️ for pet owners and their furry family members.

---

**"Pets aren't just pets... they are FAMILY!"** - Jake's Bath House