Real-Time Chat Application
A modern, full-stack chat application built from scratch to demonstrate real-time communication, user authentication, and a responsive user interface.

🚀 Features
User Authentication: Secure user registration and login with password hashing using bcrypt.js.

Real-time Messaging: Instant message delivery using WebSockets with Socket.IO.

Conversation History: Displays a list of recent conversations in a sidebar.

Responsive UI: A clean, modern, and fully responsive design that works seamlessly on both desktop and mobile devices.

🛠️ Technologies Used
Backend
Node.js: The server-side JavaScript runtime environment.

Express.js: A web application framework for building the API endpoints.

Socket.IO: Enables real-time, bidirectional communication between the client and server.

MySQL: The relational database for storing user accounts and messages.

bcrypt.js: A library for securely hashing user passwords.

CORS: A Node.js package for enabling cross-origin requests.

Frontend
HTML5: Provides the structure for the web pages.

CSS3: Handles all styling, including a modern, gradient-based design and responsiveness.

JavaScript: Manages all client-side logic, including DOM manipulation and API calls.

⚙️ Setup and Installation
Follow these steps to get a local copy of the project up and running on your machine.

Prerequisites
You will need to have the following software installed:

Node.js & npm: Download and install from here

XAMPP: A web server package that includes Apache, PHP, and MySQL. Download and install from here

1. Database Setup
Start the Apache and MySQL services from your XAMPP Control Panel.

Open your web browser and go to http://localhost/phpmyadmin.

Create a new database named chatdb.

In the chatdb database, run the following SQL queries to create the users and messages tables:

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    age INT,
    gender VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    receiver_id INT,
    message_text TEXT NOT NULL,
    time_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
);

2. Backend Setup
Open your terminal and navigate to the backend folder of the project.

Install the required Node.js packages:

npm install

Start the backend server:

npm run start

Your server should now be running on http://localhost:3000.

3. Frontend Setup
Open the login.html file in your preferred web browser. You can do this by dragging the file into the browser or by navigating to its file path.

Register a new user account with a unique username and a password. The password will be securely hashed in the database.

After successful registration, log in with your new credentials.

You will be redirected to the chat.html page, where you can start chatting in real time.