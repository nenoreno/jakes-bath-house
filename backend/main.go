package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"  
    "os"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    _ "github.com/lib/pq"
    "golang.org/x/crypto/bcrypt"
    "github.com/gorilla/websocket"
    "github.com/lib/pq"
    "github.com/stripe/stripe-go/v76"
    "github.com/stripe/stripe-go/v76/paymentintent"
)

// Models
type User struct {
    ID        int       `json:"id" db:"id"`
    Name      string    `json:"name" db:"name"`
    Email     string    `json:"email" db:"email"`
    Phone     string    `json:"phone" db:"phone"`
    Password  string    `json:"-" db:"password"` // Don't send password in JSON
    WashCount int       `json:"wash_count" db:"wash_count"`
    Role      string    `json:"role" db:"role"`
    Status    string    `json:"status" db:"status"`
    LastLogin *time.Time `json:"last_login" db:"last_login"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type AdminUser struct {
    ID        int       `json:"id" db:"id"`
    UserID    int       `json:"user_id" db:"user_id"`
    Role      string    `json:"role" db:"role"`
    HiredDate *time.Time `json:"hired_date" db:"hired_date"`
    Salary    *float64  `json:"salary" db:"salary"`
    Notes     string    `json:"notes" db:"notes"`
    CreatedBy int       `json:"created_by" db:"created_by"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    
    // Joined fields
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    Phone     string    `json:"phone"`
    UserStatus string   `json:"user_status"`
    LastLogin *time.Time `json:"last_login"`
}

type Role struct {
    ID          int       `json:"id" db:"id"`
    Name        string    `json:"name" db:"name"`
    DisplayName string    `json:"display_name" db:"display_name"`
    Description string    `json:"description" db:"description"`
    Permissions []string  `json:"permissions"`
    Color       string    `json:"color" db:"color"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type BusinessSetting struct {
    ID          int       `json:"id" db:"id"`
    Category    string    `json:"category" db:"category"`
    SettingKey  string    `json:"setting_key" db:"setting_key"`
    SettingValue string   `json:"setting_value" db:"setting_value"`
    DataType    string    `json:"data_type" db:"data_type"`
    Description string    `json:"description" db:"description"`
    UpdatedBy   *int      `json:"updated_by" db:"updated_by"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type Pet struct {
    ID     int    `json:"id" db:"id"`
    UserID int    `json:"user_id" db:"user_id"`
    Name   string `json:"name" db:"name"`
    Breed  string `json:"breed" db:"breed"`
    Size   string `json:"size" db:"size"`
    Notes  string `json:"notes" db:"notes"`
}

type Service struct {
    ID                int     `json:"id" db:"id"`
    Name              string  `json:"name" db:"name"`
    Type              string  `json:"type" db:"type"`
    Price             float64 `json:"price" db:"price"`
    DurationMinutes   int     `json:"duration_minutes" db:"duration_minutes"`
    Description       string  `json:"description" db:"description"`
    Active            bool    `json:"active" db:"active"`
    RequiresDeposit   bool    `json:"requires_deposit" db:"requires_deposit"`
    DepositPercentage int     `json:"deposit_percentage" db:"deposit_percentage"`
}

type Appointment struct {
    ID              int       `json:"id" db:"id"`
    UserID          int       `json:"user_id" db:"user_id"`
    PetID           int       `json:"pet_id" db:"pet_id"`
    ServiceID       int       `json:"service_id" db:"service_id"`
    AppointmentDate string    `json:"appointment_date" db:"appointment_date"`
    AppointmentTime string    `json:"appointment_time" db:"appointment_time"`
    Date            string    `json:"date"` // Alias for AppointmentDate
    Time            string    `json:"time"` // Alias for AppointmentTime
    Status          string    `json:"status" db:"status"`
    Notes           string    `json:"notes" db:"notes"`
    PaymentID       *int      `json:"payment_id" db:"payment_id"`
    CreatedAt       time.Time `json:"created_at" db:"created_at"`
    
    // Joined fields for display
    UserName      string  `json:"user_name"`
    UserEmail     string  `json:"user_email"`
    PetName       string  `json:"pet_name"`
    ServiceName   string  `json:"service_name"`
    ServiceType   string  `json:"service_type"`
    ServicePrice  float64 `json:"service_price"`
    PaymentStatus string  `json:"payment_status"`
    AmountPaid    *float64 `json:"amount_paid"`
}

type Payment struct {
    ID              int       `json:"id" db:"id"`
    AppointmentID   *int      `json:"appointment_id" db:"appointment_id"`
    UserID          int       `json:"user_id" db:"user_id"`
    StripePaymentID string    `json:"stripe_payment_id" db:"stripe_payment_id"`
    Amount          float64   `json:"amount" db:"amount"`
    Currency        string    `json:"currency" db:"currency"`
    Status          string    `json:"status" db:"status"`
    PaymentType     string    `json:"payment_type" db:"payment_type"` // full, deposit
    CreatedAt       time.Time `json:"created_at" db:"created_at"`
    UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// WebSocket structures
type WebSocketMessage struct {
    Type string      `json:"type"`
    Data interface{} `json:"data"`
}

type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
}

type Client struct {
    hub    *Hub
    conn   *websocket.Conn
    send   chan []byte
    userID int
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

var hub *Hub

// Request/Response structs
type RegisterRequest struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Phone    string `json:"phone" binding:"required"`
    Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

type CreatePetRequest struct {
    UserID int    `json:"user_id" binding:"required"`
    Name   string `json:"name" binding:"required"`
    Breed  string `json:"breed"`
    Size   string `json:"size"`
    Notes  string `json:"notes"`
}

type CreateAppointmentRequest struct {
    UserID          int    `json:"user_id" binding:"required"`
    PetID           int    `json:"pet_id" binding:"required"`
    ServiceID       int    `json:"service_id" binding:"required"`
    AppointmentDate string `json:"appointment_date" binding:"required"`
    AppointmentTime string `json:"appointment_time" binding:"required"`
    Notes           string `json:"notes"`
}

type CreateAdminUserRequest struct {
    Name      string   `json:"name" binding:"required"`
    Email     string   `json:"email" binding:"required,email"`
    Phone     string   `json:"phone"`
    Password  string   `json:"password" binding:"required,min=6"`
    Role      string   `json:"role" binding:"required"`
    HiredDate *string  `json:"hired_date"`
    Salary    *float64 `json:"salary"`
    Notes     string   `json:"notes"`
}

type UpdateAdminUserRequest struct {
    Name      string   `json:"name"`
    Email     string   `json:"email"`
    Phone     string   `json:"phone"`
    Role      string   `json:"role"`
    Status    string   `json:"status"`
    HiredDate *string  `json:"hired_date"`
    Salary    *float64 `json:"salary"`
    Notes     string   `json:"notes"`
}

type UpdateBusinessSettingRequest struct {
    SettingValue string `json:"setting_value" binding:"required"`
}

type CreatePaymentIntentRequest struct {
    ServiceID     int     `json:"service_id" binding:"required"`
    UserID        int     `json:"user_id" binding:"required"`
    PetID         int     `json:"pet_id" binding:"required"`
    PaymentType   string  `json:"payment_type"` // "full" or "deposit"
    AppointmentID *int    `json:"appointment_id,omitempty"`
}

type AppointmentDetails struct {
    UserID int    `json:"user_id"`
    PetID  int    `json:"pet_id"`
    ServiceID int `json:"service_id"`
    Date   string `json:"date"`
    Time   string `json:"time"`
    Notes  string `json:"notes"`
}

type ConfirmPaymentRequest struct {
    PaymentIntentID     string              `json:"payment_intent_id" binding:"required"`
    AppointmentID       *int               `json:"appointment_id,omitempty"`
    AppointmentDetails  *AppointmentDetails `json:"appointment_details,omitempty"`
}

type CreateRoleRequest struct {
    Name        string   `json:"name" binding:"required"`
    DisplayName string   `json:"display_name" binding:"required"`
    Description string   `json:"description"`
    Permissions []string `json:"permissions"`
    Color       string   `json:"color"`
}

type UpdateRolePermissionsRequest struct {
    Permissions []string `json:"permissions" binding:"required"`
}

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

    // Database connection
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        dbURL = "postgres://postgres:password123@localhost:5432/jakes_bathhouse?sslmode=disable"
    }

    db, err := sql.Open("postgres", dbURL)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()

    if err := db.Ping(); err != nil {
        log.Fatal("Database ping failed:", err)
    }

    log.Println("Connected to database successfully!")

    // Initialize Stripe
    stripeKey := os.Getenv("STRIPE_SECRET_KEY")
    if stripeKey == "" {
        log.Println("Warning: STRIPE_SECRET_KEY not set - payment processing disabled")
    } else {
        stripe.Key = stripeKey
        log.Println("Stripe initialized successfully!")
    }

    // Initialize WebSocket hub
    hub = &Hub{
        broadcast:  make(chan []byte),
        register:   make(chan *Client),
        unregister: make(chan *Client),
        clients:    make(map[*Client]bool),
    }
    go hub.run()

    // Setup Gin router
    r := gin.Default()

    // Enable CORS
    r.Use(func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })

    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok", "message": "Jake's Bath House API is running!"})
    })

    // WebSocket route
    r.GET("/ws", handleWebSocket)

    // API routes
    api := r.Group("/api/v1")
    {
        // Auth routes
        api.POST("/register", func(c *gin.Context) {
            var req RegisterRequest
            if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(400, gin.H{"error": err.Error()})
                return
            }

            // Check if user already exists
            var existingUser User
            err := db.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingUser.ID)
            if err == nil {
                c.JSON(400, gin.H{"error": "User already exists with this email"})
                return
            }

            // Hash password
            hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
            if err != nil {
                c.JSON(500, gin.H{"error": "Failed to hash password"})
                return
            }

            // Insert user
            var userID int
            err = db.QueryRow(`
                INSERT INTO users (name, email, phone, password, wash_count, created_at, updated_at)
                VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            `, req.Name, req.Email, req.Phone, string(hashedPassword)).Scan(&userID)

            if err != nil {
                c.JSON(500, gin.H{"error": "Failed to create user"})
                return
            }

            // Return user without password
            user := User{
                ID:        userID,
                Name:      req.Name,
                Email:     req.Email,
                Phone:     req.Phone,
                WashCount: 0,
            }

            c.JSON(201, gin.H{"message": "User created successfully", "user": user})
        })

        api.POST("/login", func(c *gin.Context) {
            var req LoginRequest
            if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(400, gin.H{"error": err.Error()})
                return
            }

            // Get user from database
            var user User
            var hashedPassword string
            err := db.QueryRow(`
                SELECT id, name, email, phone, password, wash_count, role, status, last_login, created_at 
                FROM users WHERE email = $1
            `, req.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &hashedPassword, &user.WashCount, &user.Role, &user.Status, &user.LastLogin, &user.CreatedAt)

            if err != nil {
                c.JSON(401, gin.H{"error": "Invalid email or password"})
                return
            }

            // Check password
            err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
            if err != nil {
                c.JSON(401, gin.H{"error": "Invalid email or password"})
                return
            }

            // Check if user is active
            if user.Status != "active" {
                c.JSON(401, gin.H{"error": "Account is inactive"})
                return
            }

            // Update last login
            db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", user.ID)
            now := time.Now()
            user.LastLogin = &now

            c.JSON(200, gin.H{"message": "Login successful", "user": user})
        })

        // User routes
        api.GET("/users/:id", func(c *gin.Context) {
            userID := c.Param("id")
            
            var user User
            err := db.QueryRow(`
                SELECT id, name, email, phone, wash_count, created_at 
                FROM users WHERE id = $1
            `, userID).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.WashCount, &user.CreatedAt)

            if err != nil {
                c.JSON(404, gin.H{"error": "User not found"})
                return
            }

            c.JSON(200, gin.H{"user": user})
        })

        // Pet routes
        api.POST("/pets", func(c *gin.Context) {
            var req CreatePetRequest
            if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(400, gin.H{"error": err.Error()})
                return
            }

            var petID int
            err := db.QueryRow(`
                INSERT INTO pets (user_id, name, breed, size, notes, created_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                RETURNING id
            `, req.UserID, req.Name, req.Breed, req.Size, req.Notes).Scan(&petID)

            if err != nil {
                log.Printf("Failed to create pet: %v", err)
                c.JSON(500, gin.H{"error": "Failed to create pet"})
                return
            }

            pet := Pet{
                ID:     petID,
                UserID: req.UserID,
                Name:   req.Name,
                Breed:  req.Breed,
                Size:   req.Size,
                Notes:  req.Notes,
            }

            c.JSON(201, gin.H{"message": "Pet created successfully", "pet": pet})
        })

        api.GET("/users/:id/pets", func(c *gin.Context) {
            userID := c.Param("id")
            
            rows, err := db.Query(`
                SELECT id, user_id, name, breed, size, notes, created_at
                FROM pets WHERE user_id = $1 ORDER BY name
            `, userID)
            if err != nil {
                log.Printf("Failed to fetch pets: %v", err)
                c.JSON(500, gin.H{"error": "Failed to fetch pets"})
                return
            }
            defer rows.Close()

            var pets []Pet
            for rows.Next() {
                var pet Pet
                var createdAt time.Time
                err := rows.Scan(&pet.ID, &pet.UserID, &pet.Name, &pet.Breed, &pet.Size, &pet.Notes, &createdAt)
                if err != nil {
                    log.Printf("Error scanning pet: %v", err)
                    continue
                }
                pets = append(pets, pet)
            }

            c.JSON(200, gin.H{"pets": pets})
        })

        api.PUT("/pets/:id", func(c *gin.Context) {
            petID := c.Param("id")
            
            var req struct {
                Name  string `json:"name" binding:"required"`
                Breed string `json:"breed"`
                Size  string `json:"size"`
                Notes string `json:"notes"`
            }
            
            if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(400, gin.H{"error": err.Error()})
                return
            }

            _, err := db.Exec(`
                UPDATE pets 
                SET name = $1, breed = $2, size = $3, notes = $4
                WHERE id = $5
            `, req.Name, req.Breed, req.Size, req.Notes, petID)

            if err != nil {
                log.Printf("Failed to update pet: %v", err)
                c.JSON(500, gin.H{"error": "Failed to update pet"})
                return
            }

            c.JSON(200, gin.H{"message": "Pet updated successfully"})
        })

        api.DELETE("/pets/:id", func(c *gin.Context) {
            petID := c.Param("id")
            
            _, err := db.Exec("DELETE FROM pets WHERE id = $1", petID)
            if err != nil {
                log.Printf("Failed to delete pet: %v", err)
                c.JSON(500, gin.H{"error": "Failed to delete pet"})
                return
            }

            c.JSON(200, gin.H{"message": "Pet deleted successfully"})
        })

        // Service routes
        api.GET("/services", func(c *gin.Context) {
            rows, err := db.Query("SELECT id, name, type, price, duration_minutes, description, active, requires_deposit, deposit_percentage FROM services ORDER BY type, price")
            if err != nil {
                c.JSON(500, gin.H{"error": "Database error"})
                return
            }
            defer rows.Close()

            var services []Service
            for rows.Next() {
                var service Service
                err := rows.Scan(&service.ID, &service.Name, &service.Type, &service.Price, &service.DurationMinutes, &service.Description, &service.Active, &service.RequiresDeposit, &service.DepositPercentage)
                if err != nil {
                    continue
                }
                services = append(services, service)
            }

            c.JSON(200, gin.H{"services": services})
        })

        // Appointment routes
        api.POST("/appointments", func(c *gin.Context) {
            var req CreateAppointmentRequest
            if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(400, gin.H{"error": err.Error()})
                return
            }

            var appointmentID int
            err := db.QueryRow(`
                INSERT INTO appointments (user_id, pet_id, service_id, appointment_date, appointment_time, status, notes, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            `, req.UserID, req.PetID, req.ServiceID, req.AppointmentDate, req.AppointmentTime, req.Notes).Scan(&appointmentID)

            if err != nil {
                c.JSON(500, gin.H{"error": "Failed to create appointment"})
                return
            }

            // Update user's wash count for DIY services
            var serviceType string
            db.QueryRow("SELECT type FROM services WHERE id = $1", req.ServiceID).Scan(&serviceType)
            if serviceType == "diy" {
                db.Exec("UPDATE users SET wash_count = wash_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1", req.UserID)
            }

            // Get the created appointment for broadcasting
            var apt Appointment
            err = db.QueryRow(`
                SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, a.appointment_time,
                       a.status, a.notes, a.created_at, p.name as pet_name, s.name as service_name, s.type as service_type
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN services s ON a.service_id = s.id
                WHERE a.id = $1
            `, appointmentID).Scan(&apt.ID, &apt.UserID, &apt.PetID, &apt.ServiceID,
                &apt.AppointmentDate, &apt.AppointmentTime, &apt.Status, &apt.Notes,
                &apt.CreatedAt, &apt.PetName, &apt.ServiceName, &apt.ServiceType)

            if err == nil {
                broadcastAppointmentUpdate(apt, "created")
            }

            c.JSON(201, gin.H{"message": "Appointment created successfully", "appointment_id": appointmentID})
        })

        api.GET("/users/:id/appointments", func(c *gin.Context) {
            userID := c.Param("id")
            
            rows, err := db.Query(`
                SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, a.appointment_time, 
                       a.status, a.notes, a.created_at, p.name as pet_name, s.name as service_name, s.type as service_type
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN services s ON a.service_id = s.id
                WHERE a.user_id = $1
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
            `, userID)
            if err != nil {
                c.JSON(500, gin.H{"error": "Failed to fetch appointments"})
                return
            }
            defer rows.Close()

            var appointments []Appointment
            for rows.Next() {
                var apt Appointment
                err := rows.Scan(&apt.ID, &apt.UserID, &apt.PetID, &apt.ServiceID, 
                    &apt.AppointmentDate, &apt.AppointmentTime, &apt.Status, &apt.Notes, 
                    &apt.CreatedAt, &apt.PetName, &apt.ServiceName, &apt.ServiceType)
                if err != nil {
                    continue
                }
                appointments = append(appointments, apt)
            }
            c.JSON(200, gin.H{"appointments": appointments})
        })

        api.PUT("/appointments/:id/status", func(c *gin.Context) {
            appointmentID := c.Param("id")
            log.Printf("Updating appointment ID: %s", appointmentID)
            
            var req struct {
                Status string `json:"status" binding:"required"`
            }
            if err := c.ShouldBindJSON(&req); err != nil {
                log.Printf("JSON binding error: %v", err)
                c.JSON(400, gin.H{"error": err.Error()})
                return
            }
            
            log.Printf("Requested status: %s", req.Status)
            
            _, err := db.Exec(`
                UPDATE appointments 
                SET status = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2
            `, req.Status, appointmentID)
            
            if err != nil {
                log.Printf("Database error updating appointment status: %v", err)
                c.JSON(500, gin.H{"error": "Failed to update appointment status"})
                return
            }
            
            // Get updated appointment for broadcasting
            var apt Appointment
            err = db.QueryRow(`
                SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, a.appointment_time,
                       a.status, a.notes, a.created_at, p.name as pet_name, s.name as service_name, s.type as service_type
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN services s ON a.service_id = s.id
                WHERE a.id = $1
            `, appointmentID).Scan(&apt.ID, &apt.UserID, &apt.PetID, &apt.ServiceID,
                &apt.AppointmentDate, &apt.AppointmentTime, &apt.Status, &apt.Notes,
                &apt.CreatedAt, &apt.PetName, &apt.ServiceName, &apt.ServiceType)

            if err == nil {
                broadcastAppointmentUpdate(apt, "status_updated")
            }
            
            log.Printf("Appointment %s status updated successfully to %s", appointmentID, req.Status)
            c.JSON(200, gin.H{"message": "Appointment status updated successfully"})
        })

        // Admin-specific routes
        admin := api.Group("/admin")
        {
            // Get all appointments for admin view
            admin.GET("/appointments", func(c *gin.Context) {
                // Optional filters
                status := c.Query("status")
                date := c.Query("date")
                
                query := `
                    SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, a.appointment_time, 
                           a.status, a.notes, a.created_at, a.payment_id, p.name as pet_name, s.name as service_name, 
                           s.type as service_type, u.name as customer_name, u.email as customer_email,
                           pay.amount as amount_paid, pay.status as payment_status, pay.payment_type
                    FROM appointments a
                    JOIN pets p ON a.pet_id = p.id
                    JOIN services s ON a.service_id = s.id
                    JOIN users u ON a.user_id = u.id
                    LEFT JOIN payments pay ON a.payment_id = pay.id
                    WHERE 1=1`
                
                args := []interface{}{}
                argCount := 0
                
                if status != "" {
                    argCount++
                    query += fmt.Sprintf(" AND a.status = $%d", argCount)
                    args = append(args, status)
                }
                
                if date != "" {
                    argCount++
                    query += fmt.Sprintf(" AND a.appointment_date = $%d", argCount)
                    args = append(args, date)
                }
                
                query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC"
                
                rows, err := db.Query(query, args...)
                if err != nil {
                    log.Printf("Failed to fetch admin appointments: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to fetch appointments"})
                    return
                }
                defer rows.Close()

                var appointments []map[string]interface{}
                for rows.Next() {
                    var apt Appointment
                    var customerName, customerEmail string
                    var amountPaid sql.NullFloat64
                    var paymentStatus, paymentType sql.NullString
                    err := rows.Scan(&apt.ID, &apt.UserID, &apt.PetID, &apt.ServiceID, 
                        &apt.AppointmentDate, &apt.AppointmentTime, &apt.Status, &apt.Notes, 
                        &apt.CreatedAt, &apt.PaymentID, &apt.PetName, &apt.ServiceName, &apt.ServiceType,
                        &customerName, &customerEmail, &amountPaid, &paymentStatus, &paymentType)
                    if err != nil {
                        log.Printf("Error scanning appointment: %v", err)
                        continue
                    }
                    
                    appointmentData := map[string]interface{}{
                        "id": apt.ID,
                        "user_id": apt.UserID,
                        "pet_id": apt.PetID,
                        "service_id": apt.ServiceID,
                        "appointment_date": apt.AppointmentDate,
                        "appointment_time": apt.AppointmentTime,
                        "status": apt.Status,
                        "notes": apt.Notes,
                        "created_at": apt.CreatedAt,
                        "payment_id": apt.PaymentID,
                        "pet_name": apt.PetName,
                        "service_name": apt.ServiceName,
                        "service_type": apt.ServiceType,
                        "customer_name": customerName,
                        "customer_email": customerEmail,
                    }

                    // Add payment information if available
                    if amountPaid.Valid {
                        appointmentData["amount_paid"] = amountPaid.Float64
                    }
                    if paymentStatus.Valid {
                        appointmentData["payment_status"] = paymentStatus.String
                    }
                    if paymentType.Valid {
                        appointmentData["payment_type"] = paymentType.String
                    }
                    appointments = append(appointments, appointmentData)
                }
                
                c.JSON(200, gin.H{"appointments": appointments})
            })

            // Get dashboard statistics
            admin.GET("/stats", func(c *gin.Context) {
                today := time.Now().Format("2006-01-02")
                
                // Today's revenue
                var todayRevenue float64
                db.QueryRow(`
                    SELECT COALESCE(SUM(s.price), 0) 
                    FROM appointments a 
                    JOIN services s ON a.service_id = s.id 
                    WHERE a.appointment_date = $1 AND a.status != 'cancelled'
                `, today).Scan(&todayRevenue)
                
                // Today's appointments count
                var todayAppointments int
                db.QueryRow(`
                    SELECT COUNT(*) 
                    FROM appointments 
                    WHERE appointment_date = $1 AND status != 'cancelled'
                `, today).Scan(&todayAppointments)
                
                // Total customers
                var totalCustomers int
                db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalCustomers)
                
                // Appointments by status
                statusQuery := `
                    SELECT status, COUNT(*) 
                    FROM appointments 
                    WHERE appointment_date >= $1 
                    GROUP BY status
                `
                
                rows, err := db.Query(statusQuery, today)
                if err != nil {
                    log.Printf("Failed to fetch status stats: %v", err)
                } else {
                    defer rows.Close()
                }
                
                statusCounts := make(map[string]int)
                if err == nil {
                    for rows.Next() {
                        var status string
                        var count int
                        if err := rows.Scan(&status, &count); err == nil {
                            statusCounts[status] = count
                        }
                    }
                }
                
                stats := map[string]interface{}{
                    "today_revenue": todayRevenue,
                    "today_appointments": todayAppointments,
                    "total_customers": totalCustomers,
                    "status_counts": statusCounts,
                }
                
                c.JSON(200, gin.H{"stats": stats})
            })

            // Get customers list
            admin.GET("/customers", func(c *gin.Context) {
                rows, err := db.Query(`
                    SELECT u.id, u.name, u.email, u.phone, u.wash_count, u.created_at,
                           COUNT(p.id) as pet_count,
                           COUNT(a.id) as appointment_count
                    FROM users u
                    LEFT JOIN pets p ON u.id = p.user_id
                    LEFT JOIN appointments a ON u.id = a.user_id
                    GROUP BY u.id, u.name, u.email, u.phone, u.wash_count, u.created_at
                    ORDER BY u.created_at DESC
                `)
                if err != nil {
                    c.JSON(500, gin.H{"error": "Failed to fetch customers"})
                    return
                }
                defer rows.Close()

                var customers []map[string]interface{}
                for rows.Next() {
                    var user User
                    var petCount, appointmentCount int
                    err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Phone, 
                        &user.WashCount, &user.CreatedAt, &petCount, &appointmentCount)
                    if err != nil {
                        continue
                    }
                    
                    customerData := map[string]interface{}{
                        "id": user.ID,
                        "name": user.Name,
                        "email": user.Email,
                        "phone": user.Phone,
                        "wash_count": user.WashCount,
                        "created_at": user.CreatedAt,
                        "pet_count": petCount,
                        "appointment_count": appointmentCount,
                    }
                    customers = append(customers, customerData)
                }
                
                c.JSON(200, gin.H{"customers": customers})
            })

            // Admin User Management
            admin.GET("/users", func(c *gin.Context) {
                rows, err := db.Query(`
                    SELECT au.id, au.user_id, au.role, au.hired_date, au.salary, au.notes, au.created_at,
                           u.name, u.email, u.phone, u.status, u.last_login
                    FROM admin_users au
                    JOIN users u ON au.user_id = u.id
                    ORDER BY au.created_at DESC
                `)
                if err != nil {
                    log.Printf("Failed to fetch admin users: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to fetch admin users"})
                    return
                }
                defer rows.Close()

                var adminUsers []AdminUser
                for rows.Next() {
                    var au AdminUser
                    err := rows.Scan(&au.ID, &au.UserID, &au.Role, &au.HiredDate, &au.Salary, &au.Notes, &au.CreatedAt,
                        &au.Name, &au.Email, &au.Phone, &au.UserStatus, &au.LastLogin)
                    if err != nil {
                        log.Printf("Error scanning admin user: %v", err)
                        continue
                    }
                    adminUsers = append(adminUsers, au)
                }
                
                c.JSON(200, gin.H{"users": adminUsers})
            })

            admin.POST("/users", func(c *gin.Context) {
                var req CreateAdminUserRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                // Check if email already exists
                var existingID int
                err := db.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingID)
                if err == nil {
                    c.JSON(400, gin.H{"error": "User with this email already exists"})
                    return
                }

                // Hash password
                hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
                if err != nil {
                    c.JSON(500, gin.H{"error": "Failed to hash password"})
                    return
                }

                // Insert user
                var userID int
                err = db.QueryRow(`
                    INSERT INTO users (name, email, phone, password, role, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `, req.Name, req.Email, req.Phone, string(hashedPassword), req.Role).Scan(&userID)

                if err != nil {
                    log.Printf("Failed to create user: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to create user"})
                    return
                }

                // Insert admin user record
                var hiredDate *time.Time
                if req.HiredDate != nil {
                    if parsedDate, err := time.Parse("2006-01-02", *req.HiredDate); err == nil {
                        hiredDate = &parsedDate
                    }
                }

                _, err = db.Exec(`
                    INSERT INTO admin_users (user_id, role, hired_date, salary, notes, created_by, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, userID, req.Role, hiredDate, req.Salary, req.Notes, 1) // TODO: Use actual current user ID

                if err != nil {
                    log.Printf("Failed to create admin user: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to create admin user"})
                    return
                }

                c.JSON(201, gin.H{"message": "Admin user created successfully", "user_id": userID})
            })

            admin.PUT("/users/:id", func(c *gin.Context) {
                userID := c.Param("id")
                
                var req UpdateAdminUserRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                // Update user table
                _, err := db.Exec(`
                    UPDATE users 
                    SET name = $1, email = $2, phone = $3, role = $4, status = $5, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $6
                `, req.Name, req.Email, req.Phone, req.Role, req.Status, userID)

                if err != nil {
                    log.Printf("Failed to update user: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to update user"})
                    return
                }

                // Update admin_users table
                var hiredDate *time.Time
                if req.HiredDate != nil {
                    if parsedDate, err := time.Parse("2006-01-02", *req.HiredDate); err == nil {
                        hiredDate = &parsedDate
                    }
                }

                _, err = db.Exec(`
                    UPDATE admin_users 
                    SET role = $1, hired_date = $2, salary = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $5
                `, req.Role, hiredDate, req.Salary, req.Notes, userID)

                if err != nil {
                    log.Printf("Failed to update admin user: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to update admin user"})
                    return
                }

                c.JSON(200, gin.H{"message": "User updated successfully"})
            })

            admin.DELETE("/users/:id", func(c *gin.Context) {
                userID := c.Param("id")
                
                // Don't allow deleting super admin
                var role string
                db.QueryRow("SELECT role FROM users WHERE id = $1", userID).Scan(&role)
                if role == "super_admin" {
                    c.JSON(400, gin.H{"error": "Cannot delete super admin user"})
                    return
                }

                _, err := db.Exec("UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1", userID)
                if err != nil {
                    log.Printf("Failed to deactivate user: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to deactivate user"})
                    return
                }

                c.JSON(200, gin.H{"message": "User deactivated successfully"})
            })

            // Roles Management
            admin.GET("/roles", func(c *gin.Context) {
                rows, err := db.Query(`
                    SELECT id, name, display_name, description, permissions, color, created_at
                    FROM roles ORDER BY name
                `)
                if err != nil {
                    c.JSON(500, gin.H{"error": "Failed to fetch roles"})
                    return
                }
                defer rows.Close()

                var roles []Role
                for rows.Next() {
                    var role Role
                    var permissionsArray pq.StringArray
                    err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &permissionsArray, &role.Color, &role.CreatedAt)
                    if err != nil {
                        log.Printf("Error scanning role: %v", err)
                        continue
                    }
                    role.Permissions = []string(permissionsArray)
                    roles = append(roles, role)
                }
                
                c.JSON(200, gin.H{"roles": roles})
            })

            admin.POST("/roles", func(c *gin.Context) {
                var req CreateRoleRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                // Check if role name already exists
                var existingID int
                err := db.QueryRow("SELECT id FROM roles WHERE name = $1", req.Name).Scan(&existingID)
                if err == nil {
                    c.JSON(400, gin.H{"error": "Role with this name already exists"})
                    return
                }

                // Set default color if not provided
                if req.Color == "" {
                    req.Color = "bg-gray-500"
                }

                var roleID int
                err = db.QueryRow(`
                    INSERT INTO roles (name, display_name, description, permissions, color, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `, req.Name, req.DisplayName, req.Description, pq.Array(req.Permissions), req.Color).Scan(&roleID)

                if err != nil {
                    log.Printf("Failed to create role: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to create role"})
                    return
                }

                c.JSON(201, gin.H{"message": "Role created successfully", "role_id": roleID})
            })

            admin.PUT("/roles/:id/permissions", func(c *gin.Context) {
                roleID := c.Param("id")
                
                var req UpdateRolePermissionsRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                // Don't allow modifying super_admin permissions
                var roleName string
                db.QueryRow("SELECT name FROM roles WHERE id = $1", roleID).Scan(&roleName)
                if roleName == "super_admin" {
                    c.JSON(400, gin.H{"error": "Cannot modify super admin permissions"})
                    return
                }

                _, err := db.Exec(`
                    UPDATE roles 
                    SET permissions = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, pq.Array(req.Permissions), roleID)

                if err != nil {
                    log.Printf("Failed to update role permissions: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to update role permissions"})
                    return
                }

                c.JSON(200, gin.H{"message": "Role permissions updated successfully"})
            })

            admin.DELETE("/roles/:id", func(c *gin.Context) {
                roleID := c.Param("id")
                
                // Don't allow deleting core roles
                var roleName string
                db.QueryRow("SELECT name FROM roles WHERE id = $1", roleID).Scan(&roleName)
                if roleName == "super_admin" || roleName == "manager" || roleName == "staff" || roleName == "viewer" {
                    c.JSON(400, gin.H{"error": "Cannot delete core system roles"})
                    return
                }

                // Check if any users have this role
                var userCount int
                db.QueryRow("SELECT COUNT(*) FROM users WHERE role = $1", roleName).Scan(&userCount)
                if userCount > 0 {
                    c.JSON(400, gin.H{"error": "Cannot delete role that is assigned to users"})
                    return
                }

                _, err := db.Exec("DELETE FROM roles WHERE id = $1", roleID)
                if err != nil {
                    log.Printf("Failed to delete role: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to delete role"})
                    return
                }

                c.JSON(200, gin.H{"message": "Role deleted successfully"})
            })

            // Get available permissions list
            admin.GET("/permissions", func(c *gin.Context) {
                permissions := []map[string]interface{}{
                    {"name": "system_settings", "display": "System Settings", "category": "admin"},
                    {"name": "user_management", "display": "User Management", "category": "admin"},
                    {"name": "role_management", "display": "Role Management", "category": "admin"},
                    {"name": "financial_reports", "display": "Financial Reports", "category": "business"},
                    {"name": "appointment_management", "display": "Appointment Management", "category": "operations"},
                    {"name": "customer_management", "display": "Customer Management", "category": "operations"},
                    {"name": "service_management", "display": "Service Management", "category": "business"},
                    {"name": "analytics", "display": "Analytics", "category": "business"},
                    {"name": "staff_management", "display": "Staff Management", "category": "admin"},
                    {"name": "business_settings", "display": "Business Settings", "category": "business"},
                    {"name": "customer_service", "display": "Customer Service", "category": "operations"},
                    {"name": "pet_management", "display": "Pet Management", "category": "operations"},
                    {"name": "basic_reports", "display": "Basic Reports", "category": "operations"},
                    {"name": "schedule_view", "display": "Schedule View", "category": "operations"},
                    {"name": "customer_lookup", "display": "Customer Lookup", "category": "operations"},
                }
                
                c.JSON(200, gin.H{"permissions": permissions})
            })

            // Business Settings Management
            admin.GET("/settings", func(c *gin.Context) {
                category := c.Query("category")
                
                query := "SELECT id, category, setting_key, setting_value, data_type, description, updated_by, created_at, updated_at FROM business_settings"
                args := []interface{}{}
                
                if category != "" {
                    query += " WHERE category = $1"
                    args = append(args, category)
                }
                
                query += " ORDER BY category, setting_key"
                
                rows, err := db.Query(query, args...)
                if err != nil {
                    c.JSON(500, gin.H{"error": "Failed to fetch settings"})
                    return
                }
                defer rows.Close()

                var settings []BusinessSetting
                for rows.Next() {
                    var setting BusinessSetting
                    err := rows.Scan(&setting.ID, &setting.Category, &setting.SettingKey, &setting.SettingValue,
                        &setting.DataType, &setting.Description, &setting.UpdatedBy, &setting.CreatedAt, &setting.UpdatedAt)
                    if err != nil {
                        continue
                    }
                    settings = append(settings, setting)
                }
                
                c.JSON(200, gin.H{"settings": settings})
            })

            admin.PUT("/settings/:category/:key", func(c *gin.Context) {
                category := c.Param("category")
                key := c.Param("key")
                
                var req UpdateBusinessSettingRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                _, err := db.Exec(`
                    UPDATE business_settings 
                    SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE category = $3 AND setting_key = $4
                `, req.SettingValue, 1, category, key) // TODO: Use actual current user ID

                if err != nil {
                    log.Printf("Failed to update setting: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to update setting"})
                    return
                }

                c.JSON(200, gin.H{"message": "Setting updated successfully"})
            })

            // Get business settings by category for easy grouping
            admin.GET("/settings/categories", func(c *gin.Context) {
                rows, err := db.Query(`
                    SELECT DISTINCT category 
                    FROM business_settings 
                    ORDER BY category
                `)
                if err != nil {
                    c.JSON(500, gin.H{"error": "Failed to fetch categories"})
                    return
                }
                defer rows.Close()

                var categories []string
                for rows.Next() {
                    var category string
                    if err := rows.Scan(&category); err == nil {
                        categories = append(categories, category)
                    }
                }
                
                c.JSON(200, gin.H{"categories": categories})
            })
        }

        // Payment routes
        payments := api.Group("/payments")
        {
            // Create payment intent
            payments.POST("/intent", func(c *gin.Context) {
                var req CreatePaymentIntentRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                // Get service details for pricing
                var service Service
                err := db.QueryRow(`
                    SELECT id, name, price, type, requires_deposit, deposit_percentage
                    FROM services WHERE id = $1
                `, req.ServiceID).Scan(&service.ID, &service.Name, &service.Price, &service.Type, &service.RequiresDeposit, &service.DepositPercentage)
                if err != nil {
                    c.JSON(404, gin.H{"error": "Service not found"})
                    return
                }

                // Calculate amount based on payment type
                var amount int64
                paymentType := "full"
                if req.PaymentType == "deposit" && service.RequiresDeposit {
                    depositAmount := service.Price * float64(service.DepositPercentage) / 100
                    amount = int64(depositAmount * 100) // Convert to cents
                    paymentType = "deposit"
                } else {
                    amount = int64(service.Price * 100) // Convert to cents
                }

                // Create Stripe payment intent
                params := &stripe.PaymentIntentParams{
                    Amount:   stripe.Int64(amount),
                    Currency: stripe.String("usd"),
                    Metadata: map[string]string{
                        "service_id":     fmt.Sprintf("%d", req.ServiceID),
                        "user_id":       fmt.Sprintf("%d", req.UserID),
                        "pet_id":        fmt.Sprintf("%d", req.PetID),
                        "payment_type":  paymentType,
                        "business_name": "Jake's Bath House",
                    },
                }

                if req.AppointmentID != nil {
                    params.Metadata["appointment_id"] = fmt.Sprintf("%d", *req.AppointmentID)
                }

                pi, err := paymentintent.New(params)
                if err != nil {
                    log.Printf("Stripe payment intent creation failed: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to create payment intent"})
                    return
                }

                // Store payment record
                var paymentID int
                err = db.QueryRow(`
                    INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status, payment_type, metadata, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `, req.UserID, pi.ID, float64(amount)/100, "usd", "pending", paymentType, fmt.Sprintf(`{"service_id": %d, "pet_id": %d}`, req.ServiceID, req.PetID)).Scan(&paymentID)

                if err != nil {
                    log.Printf("Failed to store payment record: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to create payment record"})
                    return
                }

                c.JSON(200, gin.H{
                    "client_secret": pi.ClientSecret,
                    "payment_id":    paymentID,
                    "amount":        float64(amount) / 100,
                    "payment_type":  paymentType,
                })
            })

            // Confirm payment and create/update appointment
            payments.POST("/confirm", func(c *gin.Context) {
                var req ConfirmPaymentRequest
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(400, gin.H{"error": err.Error()})
                    return
                }

                // Get payment intent from Stripe
                pi, err := paymentintent.Get(req.PaymentIntentID, nil)
                if err != nil {
                    log.Printf("Failed to retrieve payment intent: %v", err)
                    c.JSON(400, gin.H{"error": "Invalid payment intent"})
                    return
                }

                // Update payment status
                _, err = db.Exec(`
                    UPDATE payments 
                    SET status = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_payment_id = $2
                `, pi.Status, pi.ID)

                if err != nil {
                    log.Printf("Failed to update payment status: %v", err)
                    c.JSON(500, gin.H{"error": "Failed to update payment"})
                    return
                }

                // If payment succeeded and we have appointment details, create/update appointment
                if pi.Status == "succeeded" && req.AppointmentDetails != nil {
                    details := req.AppointmentDetails
                    
                    if req.AppointmentID != nil {
                        // Update existing appointment
                        _, err = db.Exec(`
                            UPDATE appointments 
                            SET payment_id = (SELECT id FROM payments WHERE stripe_payment_id = $1),
                                status = 'confirmed',
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $2
                        `, pi.ID, *req.AppointmentID)
                    } else {
                        // Create new appointment
                        var appointmentID int
                        err = db.QueryRow(`
                            INSERT INTO appointments (user_id, pet_id, service_id, appointment_date, appointment_time, 
                                                    status, payment_id, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, $5, 'confirmed', 
                                   (SELECT id FROM payments WHERE stripe_payment_id = $6),
                                   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            RETURNING id
                        `, details.UserID, details.PetID, details.ServiceID, details.Date, details.Time, pi.ID).Scan(&appointmentID)

                        if err != nil {
                            log.Printf("Failed to create appointment: %v", err)
                            c.JSON(500, gin.H{"error": "Payment successful but failed to create appointment"})
                            return
                        }

                        // Broadcast the new appointment
                        var appointment Appointment
                        err = db.QueryRow(`
                            SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, a.appointment_time, a.status,
                                   u.name, u.email, p.name, s.name, s.price, s.type
                            FROM appointments a
                            JOIN users u ON a.user_id = u.id
                            JOIN pets p ON a.pet_id = p.id
                            JOIN services s ON a.service_id = s.id
                            WHERE a.id = $1
                        `, appointmentID).Scan(&appointment.ID, &appointment.UserID, &appointment.PetID, &appointment.ServiceID,
                            &appointment.AppointmentDate, &appointment.AppointmentTime, &appointment.Status, &appointment.UserName,
                            &appointment.UserEmail, &appointment.PetName, &appointment.ServiceName, &appointment.ServicePrice, &appointment.ServiceType)

                        // Set alias fields
                        appointment.Date = appointment.AppointmentDate
                        appointment.Time = appointment.AppointmentTime

                        if err == nil {
                            broadcastAppointmentUpdate(appointment, "created")
                        }
                    }

                    if err != nil {
                        log.Printf("Failed to handle appointment: %v", err)
                        c.JSON(500, gin.H{"error": "Payment successful but appointment handling failed"})
                        return
                    }
                }

                c.JSON(200, gin.H{
                    "status":           pi.Status,
                    "payment_intent_id": pi.ID,
                    "message":          "Payment processed successfully",
                })
            })

            // Get payment status
            payments.GET("/status/:payment_intent_id", func(c *gin.Context) {
                paymentIntentID := c.Param("payment_intent_id")

                pi, err := paymentintent.Get(paymentIntentID, nil)
                if err != nil {
                    c.JSON(404, gin.H{"error": "Payment intent not found"})
                    return
                }

                // Get local payment record
                var payment Payment
                err = db.QueryRow(`
                    SELECT id, user_id, amount, currency, status, payment_type, created_at
                    FROM payments WHERE stripe_payment_id = $1
                `, paymentIntentID).Scan(&payment.ID, &payment.UserID, &payment.Amount, &payment.Currency, &payment.Status, &payment.PaymentType, &payment.CreatedAt)

                if err != nil {
                    c.JSON(404, gin.H{"error": "Payment record not found"})
                    return
                }

                c.JSON(200, gin.H{
                    "payment_intent_id": pi.ID,
                    "status":           pi.Status,
                    "amount":           payment.Amount,
                    "currency":         payment.Currency,
                    "payment_type":     payment.PaymentType,
                    "created_at":       payment.CreatedAt,
                })
            })
        }
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8081"
    }

    log.Printf("Server starting on port %s", port)
    r.Run(":" + port)
}

// WebSocket functions
func (h *Hub) run() {
    for {
        select {
        case client := <-h.register:
            h.clients[client] = true
            log.Printf("Client connected. Total clients: %d", len(h.clients))

        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
                log.Printf("Client disconnected. Total clients: %d", len(h.clients))
            }

        case message := <-h.broadcast:
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
        }
    }
}

func handleWebSocket(c *gin.Context) {
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("WebSocket upgrade error: %v", err)
        return
    }

    userIDStr := c.Query("user_id")
    userID, _ := strconv.Atoi(userIDStr)

    client := &Client{
        hub:    hub,
        conn:   conn,
        send:   make(chan []byte, 256),
        userID: userID,
    }

    client.hub.register <- client
    go client.writePump()
    go client.readPump()
}

func (c *Client) readPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()

    for {
        _, _, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
    }
}

func (c *Client) writePump() {
    ticker := time.NewTicker(54 * time.Second)
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()

    for {
        select {
        case message, ok := <-c.send:
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            c.conn.WriteMessage(websocket.TextMessage, message)

        case <-ticker.C:
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}

// Broadcast appointment updates to connected WebSocket clients
func broadcastAppointmentUpdate(appointment Appointment, action string) {
    message := WebSocketMessage{
        Type: "appointment_update",
        Data: map[string]interface{}{
            "action":      action,
            "appointment": appointment,
            "timestamp":   time.Now(),
        },
    }

    messageBytes, err := json.Marshal(message)
    if err != nil {
        log.Printf("Error marshaling WebSocket message: %v", err)
        return
    }

    hub.broadcast <- messageBytes
}