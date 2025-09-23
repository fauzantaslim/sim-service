# 🚗 SIM Service API

API untuk Sistem Informasi Manajemen dengan fitur CRUD User, KTP (Kartu Tanda Penduduk), dan SIM (Surat Izin Mengemudi). Mendukung autentikasi JWT, pagination, search, dan sorting dengan keamanan CSRF protection.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Testing with Postman](#-testing-with-postman)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## ✨ Features

- 🔐 **JWT Authentication** dengan refresh token
- 🍪 **HTTP-only Cookie** untuk refresh token
- 🛡️ **CSRF Protection** untuk semua endpoint POST/PUT/DELETE
- 👥 **User Management** dengan CRUD operations
- 🆔 **SIM Management** dengan validasi lengkap
- 📄 **Pagination & Search** untuk semua list endpoints
- 🔍 **Advanced Filtering** dan sorting
- 📚 **Swagger Documentation** yang lengkap
- 🧪 **Postman Collection** untuk testing
- 🏗️ **Clean Architecture** dengan separation of concerns

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL
- **ORM**: Knex.js
- **Authentication**: JWT + HTTP-only cookies
- **Security**: CSRF protection, Helmet, CORS
- **Documentation**: Swagger UI
- **Validation**: Zod
- **Hashing**: bcrypt
- **Logging**: Pino

## 📋 Prerequisites

Sebelum menjalankan aplikasi, pastikan Anda telah menginstall:

- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [MySQL](https://www.mysql.com/) (v8.0 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)

## 🚀 Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd service-sim
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build TypeScript**
   ```bash
   npm run build
   ```

## 🗄️ Database Setup

1. **Buat database MySQL**
   ```sql
   CREATE DATABASE sim_service_dev;
   ```

2. **Jalankan migrations**
   ```bash
   npm run migrate:latest
   ```

3. **Jalankan seeders (opsional)**
   ```bash
   npm run seed:run
   ```

## ⚙️ Environment Variables

Buat file `.env` di root directory dengan konfigurasi berikut:

```env
# Server Configuration
PORT=8026
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sim_service
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CSRF Configuration
CSRF_SECRET=your-csrf-secret-key-change-this-in-production

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

Aplikasi akan berjalan di `http://localhost:8026`

## 📚 API Documentation

### Swagger UI
Setelah aplikasi berjalan, akses dokumentasi API di:
```
http://localhost:8026/api-docs
```

### Postman Collection
Import file `docs/sim.postman_collection.json` ke Postman untuk testing yang mudah.

## 🔒 Security Features

### 1. JWT Authentication
- Access token dengan expiry 15 menit
- Refresh token dengan expiry 7 hari
- HTTP-only cookie untuk refresh token

### 2. CSRF Protection
- Double CSRF protection menggunakan `csrf-csrf` library
- Token otomatis disimpan di HTTP-only cookie
- Header `X-CSRF-Token` diperlukan untuk POST/PUT/DELETE

### 3. Password Security
- Bcrypt hashing dengan salt rounds
- Password minimum 8 karakter

### 4. CORS Configuration
- Whitelist origin untuk frontend
- Credentials support untuk cookie

### 5. Rate Limiting
- Express rate limiting untuk mencegah abuse

## 🧪 Testing with Postman

1. **Import Collection**
   - Buka Postman
   - Import file `docs/sim.postman_collection.json`

2. **Setup Environment**
   - Set `baseUrl` variable ke `http://localhost:8026`

3. **Testing Flow**
   ```
   1. Get CSRF Token
   2. Login (akan set refresh token cookie)
   3. Test protected endpoints
   4. Refresh token (menggunakan cookie)
   5. Logout
   ```

## 📁 Project Structure

```
service-sim/
├── docs/                          # Documentation
│   ├── swagger.json              # Swagger API documentation
│   ├── sim.postman_collection.json # Postman collection
│   └── erdSim.puml               # Database ERD
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── index.ts                  # Application entry point
│   ├── configs/                  # Configuration files
│   ├── controllers/              # Request handlers
│   ├── middlewares/              # Custom middlewares
│   ├── migrations/               # Database migrations
│   ├── models/                   # Data models
│   ├── repositories/             # Data access layer
│   ├── routes/                   # Route definitions
│   ├── seeds/                    # Database seeders
│   ├── services/                 # Business logic
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── validations/              # Input validation schemas
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── knexfile.ts                   # Knex database configuration
└── README.MD                     # This file
```
