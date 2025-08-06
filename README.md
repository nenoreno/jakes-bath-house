
# 🐕 Jake's Bath House

A modern full-stack mobile application for pet grooming and self-service wash booking, built for Jake's Bath House in Royal Palm Beach, Florida.

## ✨ Features

- 📱 **Mobile-First Design** - Responsive web app that works like a native mobile app
- 🔐 **User Authentication** - Secure registration and login system
- 📅 **Appointment Booking** - Book professional grooming and DIY wash stations
- 🐾 **Pet Management** - Add and manage multiple pets per account
- 🏆 **Rewards System** - Earn points and get free washes after every 5 visits
- 📲 **Real-Time Updates** - Get notifications when grooming is complete
- 💳 **Service Management** - Browse different grooming packages and pricing

## 🏗️ Tech Stack

### Frontend
- **React 18** with Hooks
- **Tailwind CSS** for styling
- **Vite** for fast development and building
- **Axios** for API communication
- **Lucide React** for icons

### Backend  
- **Go (Golang)** with Gin framework
- **PostgreSQL** database
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

3. **Setup Backend**
   ```bash
   cd ../backend
   go mod tidy
   go run main.go
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

5. **Open the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

## 📱 Demo Account

Try the app with the demo account:
- **Email:** `sarah@example.com`
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
│   └── docker-compose.yml  # Database container
└── README.md
```

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgres://postgres:password123@localhost:5432/jakes_bathhouse?sslmode=disable
PORT=8080
```

## 🌟 Key Features Explained

### Authentication System
- Secure user registration and login
- Password hashing with bcrypt
- Session management with localStorage
- Protected routes and user context

### Mobile App Experience
- Bottom tab navigation
- Card-based UI design
- Touch-friendly interactions
- Responsive design for all screen sizes

### Business Logic
- Service booking for DIY washes and professional grooming
- Rewards tracking (every 5th visit is free)
- Appointment status management
- User profile and pet management

## 📊 Database Schema

The app uses PostgreSQL with the following main tables:
- **users** - Customer accounts and authentication
- **pets** - Pet profiles linked to users
- **services** - Available grooming services and pricing
- **appointments** - Booking records and status
- **rewards** - Points and reward tracking

## 🚧 Current Status

This is an active project built for Jake's Bath House. Current functionality includes:

✅ User authentication and registration  
✅ Mobile-responsive design  
✅ Service browsing and pricing display  
✅ Basic appointment booking interface  
✅ Rewards progress tracking  

🔄 **In Development:**
- Payment processing integration
- Real-time appointment status updates
- Push notifications
- Admin dashboard for Jake's team

## 🎯 Future Enhancements

- **React Native Conversion** - Convert to native iOS/Android apps
- **Payment Integration** - Stripe/Square payment processing
- **Admin Dashboard** - Management interface for staff
- **SMS Notifications** - Text updates for appointment status
- **Photo Upload** - Before/after grooming photos
- **Calendar Integration** - Google Calendar sync
- **Review System** - Customer feedback and ratings

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