package main

import (
    "database/sql"
    "encoding/json"
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
)

// Models
type User struct {
    ID        int       `json:"id" db:"id"`
    Name      string    `json:"name" db:"name"`
    Email     string    `json:"email" db:"email"`
    Phone     string    `json:"phone" db:"phone"`
    Password  string    `json:"-" db:"password"` // Don't send password in JSON
    WashCount int       `json:"wash_count" db:"wash_count"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
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
    ID              int     `json:"id" db:"id"`
    Name            string  `json:"name" db:"name"`
    Type            string  `json:"type" db:"type"`
    Price           float64 `json:"price" db:"price"`
    DurationMinutes int     `json:"duration_minutes" db:"duration_minutes"`
    Description     string  `json:"description" db:"description"`
    Active          bool    `json:"active" db:"active"`
}

type Appointment struct {
    ID              int       `json:"id" db:"id"`
    UserID          int       `json:"user_id" db:"user_id"`
    PetID           int       `json:"pet_id" db:"pet_id"`
    ServiceID       int       `json:"service_id" db:"service_id"`
    AppointmentDate string    `json:"appointment_date" db:"appointment_date"`
    AppointmentTime string    `json:"appointment_time" db:"appointment_time"`
    Status          string    `json:"status" db:"status"`
    Notes           string    `json:"notes" db:"notes"`
    CreatedAt       time.Time `json:"created_at" db:"created_at"`
    
    // Joined fields for display
    PetName     string `json:"pet_name"`
    ServiceName string `json:"service_name"`
    ServiceType string `json:"service_type"`
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
                SELECT id, name, email, phone, password, wash_count, created_at 
                FROM users WHERE email = $1
            `, req.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &hashedPassword, &user.WashCount, &user.CreatedAt)

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
            rows, err := db.Query("SELECT id, name, type, price, duration_minutes, description FROM services WHERE active = true ORDER BY type, price")
            if err != nil {
                c.JSON(500, gin.H{"error": "Database error"})
                return
            }
            defer rows.Close()

            var services []Service
            for rows.Next() {
                var service Service
                err := rows.Scan(&service.ID, &service.Name, &service.Type, &service.Price, &service.DurationMinutes, &service.Description)
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
            
            log.Printf("Appointment %s status updated successfully to %s", appointmentID, req.Status)
            c.JSON(200, gin.H{"message": "Appointment status updated successfully"})
        })
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