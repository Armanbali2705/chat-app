const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const saltRounds = 10; // For password hashing

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "chatdb",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database ✅");
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room for a conversation
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Test route
app.get("/", (req, res) => {
    res.send("Backend running ✅");
});

// Get a list of conversations for a user
app.get("/getConversations/:userId", (req, res) => {
    const { userId } = req.params;
    const sql = `
        SELECT DISTINCT
            CASE
                WHEN sender_id = ? THEN receiver_id
                ELSE sender_id
            END AS other_user_id,
            CASE
                WHEN sender_id = ? THEN (SELECT username FROM users WHERE user_id = receiver_id)
                ELSE (SELECT username FROM users WHERE user_id = sender_id)
            END AS other_username
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        ORDER BY message_id DESC;
    `;
    db.query(sql, [userId, userId, userId, userId], (err, results) => {
        if (err) {
            console.error("Error fetching conversations:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, conversations: results });
    });
});

// User Registration Endpoint
app.post("/register", (req, res) => {
    const { username, password, first_name, last_name, age, gender, email } = req.body;
    
    const checkUserSql = "SELECT user_id FROM users WHERE username = ?";
    db.query(checkUserSql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            return res.status(409).json({ error: "Username already exists." });
        }
        
        // Hash the password before storing it
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ error: "Server error" });
            }
            const insertUserSql = "INSERT INTO users (username, password, first_name, last_name, age, gender, email) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const values = [username, hash, first_name, last_name, age, gender, email];
            db.query(insertUserSql, values, (err, result) => {
                if (err) {
                    console.error("Error inserting new user:", err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(201).json({ success: true, message: "User registered successfully!" });
            });
        });
    });
});

// User Login Endpoint
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    const sql = "SELECT user_id, password FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid username or password." });
        }
        
        const user = results[0];
        // Compare the provided password with the stored hash
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ error: "Server error" });
            }
            if (isMatch) {
                res.json({ success: true, user_id: user.user_id, message: "Login successful!" });
            } else {
                res.status(401).json({ error: "Invalid username or password." });
            }
        });
    });
});

// Get User ID from Username
app.get("/getUserID/:username", (req, res) => {
    const { username } = req.params;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }
    const sql = "SELECT user_id FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ success: true, user_id: results[0].user_id });
    });
});

// Send Message API
app.post("/sendMessage", (req, res) => {
    const { sender, receiver, message } = req.body;
    if (!sender || !receiver || !message) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const sql = "INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)";
    db.query(sql, [sender, receiver, message], (err, result) => {
        if (err) {
            console.error("Error inserting message:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        // After inserting, emit the message to the clients via WebSocket
        const room = [sender, receiver].sort().join('-');
        io.to(room).emit('receiveMessage', { sender, receiver, message });

        res.json({ success: true, message: "Message sent successfully!" });
    });
});

// Get messages between sender and receiver
app.get("/getMessages", (req, res) => {
    const { sender, receiver } = req.query;
    if (!sender || !receiver) {
        return res.status(400).json({ error: "Sender and receiver are required" });
    }
    const sql = `
        SELECT m.*, s.username AS sender_username
        FROM messages m
        JOIN users s ON m.sender_id = s.user_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.message_id ASC
    `;
    db.query(sql, [sender, receiver, receiver, sender], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, messages: results });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
