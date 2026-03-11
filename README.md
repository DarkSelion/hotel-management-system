# Hotel Management System

A scalable and configurable hotel management system built with Node.js, Express, MySQL, and Bootstrap 5.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** HTML, Bootstrap 5, Vanilla JavaScript
- **Authentication:** JWT (JSON Web Tokens)

## Features

- User authentication with role-based access control (Admin, Receptionist, Manager)
- Room management and availability checking
- Reservation system with automatic tax calculation
- Payment recording and balance tracking
- Dashboard with real-time statistics

## Prerequisites

- [XAMPP](https://www.apachefriends.org)
- [Node.js](https://nodejs.org)

## Installation

**1. Clone the repository**

    git clone https://github.com/DarkSelion/hotel-management-system.git
    cd hotel-management-system

**2. Install dependencies**

    cd hotel-backend
    npm install

**3. Create .env file inside hotel-backend**

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=hotel_management_system
    JWT_SECRET=hotelSecretKey123
    PORT=3000

**4. Set up database**

1. Open XAMPP and start Apache and MySQL
2. Go to http://localhost/phpmyadmin
3. Create database named hotel_management_system
4. Click Import tab
5. Select database/hotel_management_system.sql
6. Click Go

**5. Run the server**

    cd hotel-backend
    npm run dev

**6. Open the frontend**

Open hotel-frontend/login.html in your browser

## Default Admin Registration

Use Postman to register your admin account:

    POST http://localhost:3000/api/auth/register

    {
        "name": "Admin User",
        "email": "admin@hotel.com",
        "password": "admin123",
        "role_id": 1
    }

## API Endpoints

**Authentication**

    POST /api/auth/register
    POST /api/auth/login

**Rooms**

    GET    /api/rooms
    GET    /api/rooms/availability
    POST   /api/rooms
    PATCH  /api/rooms/:id/status

**Reservations**

    POST   /api/reservations
    GET    /api/reservations
    GET    /api/reservations/:id
    PATCH  /api/reservations/:id/cancel
    PATCH  /api/reservations/:id/checkin
    PATCH  /api/reservations/:id/checkout

**Payments**

    POST   /api/payments
    GET    /api/payments
    GET    /api/payments/reservation/:id

## Project Structure

    hotel-management-system/
    ├── database/
    │   └── hotel_management_system.sql
    ├── hotel-backend/
    │   ├── config/
    │   │   └── db.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── paymentController.js
    │   │   ├── reservationController.js
    │   │   └── roomController.js
    │   ├── middleware/
    │   │   └── authMiddleware.js
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── paymentRoutes.js
    │   │   ├── reservationRoutes.js
    │   │   └── roomRoutes.js
    │   ├── package.json
    │   └── server.js
    └── hotel-frontend/
        ├── login.html
        ├── dashboard.html
        ├── rooms.html
        ├── reservations.html
        └── payments.html

## Scalability Features

- Connection pooling for handling multiple simultaneous users
- Modular architecture separating controllers, routes, and middleware
- Stateless JWT authentication supporting horizontal scaling
- Database-driven configuration for tax rates and room types

## Default System Configuration

| Setting | Value |
|---------|-------|
| Tax Rate | 12% |
| Max Stay | 30 nights |
| Cancellation Fee | 10% |
| Currency | PHP |

## Future Enhancements

- Docker containerization
- AWS cloud deployment
- Online payment gateway
- Mobile application
- AI-based dynamic pricing
