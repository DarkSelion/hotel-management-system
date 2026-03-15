# Hotel Management System

A scalable and configurable hotel management system built with Node.js, Express, MySQL, and Bootstrap 5.

## Live Demo

- **Frontend:** http://hms-capstone-frontend.s3-website-ap-southeast-2.amazonaws.com/login.html
- **Backend API:** http://3.106.251.7:3000
- **Database:** AWS RDS MySQL

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** HTML, Bootstrap 5, Vanilla JavaScript
- **Authentication:** JWT (JSON Web Tokens)
- **Cloud:** AWS EC2, RDS, S3

## Features

- User authentication with role-based access control (Admin, Receptionist, Manager)
- Room management and availability checking
- Reservation system with automatic tax calculation
- Payment recording and balance tracking
- Dashboard with real-time statistics
- Cloud deployed and accessible from any device

## Prerequisites

- [XAMPP](https://www.apachefriends.org)
- [Node.js](https://nodejs.org)
- [Postman](https://www.postman.com/downloads)

## Local Installation

**1. Clone the repository**

    git clone https://github.com/DarkSelion/hotel-management-system.git
    cd hotel-management-system

**2. Install dependencies**

    cd hotel-backend
    npm install

**3. Create .env file inside hotel-backend**

    DB_HOST=hotel-management-db.closaoq4eetp.ap-southeast-2.rds.amazonaws.com
    DB_USER=admin
    DB_PASSWORD=johncarlo
    DB_NAME=hotel_management_system
    DB_PORT=3306
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

## Register Accounts

Use Postman to register accounts:

    POST http://3.106.251.7:3000/api/auth/register

    Admin:
    {
      "name": "Admin User",
      "email": "admin@hotel.com",
      "password": "admin123",
      "role_id": 1
    }

    Receptionist:
    {
      "name": "Receptionist User",
      "email": "receptionist@hotel.com",
      "password": "receptionist123",
      "role_id": 2
    }

    Manager:
    {
      "name": "Manager User",
      "email": "manager@hotel.com",
      "password": "manager123",
      "role_id": 3
    }

## Role IDs

    1 = Admin
    2 = Receptionist
    3 = Manager

## Login

    POST http://3.106.251.7:3000/api/auth/login

    {
      "email": "admin@hotel.com",
      "password": "admin123"
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
    │   ├── .env.example
    │   ├── package.json
    │   └── server.js
    └── hotel-frontend/
        ├── login.html
        ├── dashboard.html
        ├── rooms.html
        ├── reservations.html
        └── payments.html

## AWS Deployment

**EC2 Server Access**

    # Fix permissions
    icacls "C:\hotel-key.pem" /inheritance:r
    icacls "C:\hotel-key.pem" /grant:r "%username%:(R)"
    icacls "C:\hotel-key.pem" /remove "BUILTIN\Users"

    # Connect to EC2
    ssh -i "C:\hotel-key.pem" ubuntu@3.106.251.7

**Database Access**

    mysql -h hotel-management-db.closaoq4eetp.ap-southeast-2.rds.amazonaws.com -u admin -p

    Password: johncarlo

**Environment Variables on EC2**

    DB_HOST=hotel-management-db.closaoq4eetp.ap-southeast-2.rds.amazonaws.com
    DB_USER=admin
    DB_PASSWORD=johncarlo
    DB_NAME=hotel_management_system
    DB_PORT=3306
    JWT_SECRET=hotelSecretKey123
    PORT=3000

**PM2 Commands**

    pm2 status
    pm2 restart hotel-backend
    pm2 logs hotel-backend

## Scalability Features

- Connection pooling for handling multiple simultaneous users
- Modular architecture separating controllers, routes, and middleware
- Stateless JWT authentication supporting horizontal scaling
- Database-driven configuration for tax rates and room types
- Cloud deployed on AWS EC2, RDS, and S3

## Default System Configuration

| Setting | Value |
|---------|-------|
| Tax Rate | 12% |
| Max Stay | 30 nights |
| Cancellation Fee | 10% |
| Currency | PHP |

## Future Enhancements

- Docker containerization
- Online payment gateway integration
- Mobile application
- AI-based dynamic pricing
- CloudFront HTTPS support
