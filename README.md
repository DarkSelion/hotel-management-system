Project Structure

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




Install Required Software:
1. XAMPP      → https://www.apachefriends.org
2. Node.js    → https://nodejs.org

 Install Required Software:

npm install

Create .env File
Inside hotel-backend folder create a new file called .env and paste:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_management_system
JWT_SECRET=hotelSecretKey123
PORT=3000


Open XAMPP and start Apache and MySQL
Go to `http://localhost/phpmyadmin`
Click **New** on left sidebar
Type `hotel_management_system` and click **Create**
Click the **Import** tab
Click **Choose File**

cd hotel-management-system\hotel-backend
npm run dev
