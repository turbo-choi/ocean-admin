# Ocean Admin

🌊 **Modern & Secure Admin Dashboard System**

Full-stack admin dashboard built with React 19, TypeScript, Express, and SQLite. Features dynamic menu management, custom board types, role-based access control, and comprehensive security hardening.

---

## 🚀 Key Features

### 🛡️ Security First
- **Authentication**: Secure JWT-based auth (Access + Refresh tokens) with bcrypt password hashing.
- **Access Control**: Strict role-based access control (Admin vs User).
- **Protection**:
  - **Helmet**: Secure HTTP headers.
  - **CORS**: Whitelisted origin policy.
  - **Rate Limiting**: Brute-force protection on login (10 req/15min) and general API throttling (100 req/1min).
  - **Input Validation**: Strict validation for all inputs, including URL schemes in menus.

### 🧩 Dynamic Management
- **Menu System**: Create, edit, and reorder menus dynamically without code changes. Supports internal routes, board links, and external URLs.
- **Board Types**: Create custom board types (e.g., Notice, Gallery, Q&A) with unique URL slugs.
- **Content Management**: Full CRUD for posts and comments with rich text support.

### 📊 Dashboard & Analytics
- **Real-time Stats**: Users, posts, comments, and active sessions.
- **Activity Logs**: Recent user actions and login history.
- **Visualizations**: Interactive charts for data analysis.

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, React Router DOM |
| **Backend** | Node.js, Express, Better-SQLite3, JWT, Bcrypt |
| **DevOps** | Native ESM, Concurrently |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/turbo-choi/ocean-admin.git
    cd ocean-admin
    ```

2.  **Install dependencies**
    ```bash
    # Install backend dependencies
    cd backend
    npm install

    # Install frontend dependencies
    cd ../front
    npm install
    ```

3.  **Environment Configuration**
    Create `.env` files in `backend/` and `front/` based on `.env.example`.

    **Backend (`backend/.env`):**
    ```env
    PORT=3001
    JWT_SECRET=your_complex_secret_key
    JWT_REFRESH_SECRET=your_complex_refresh_secret_key
    CORS_ORIGINS=http://localhost:3000
    NODE_ENV=development
    ```

---

## 🚀 Running the Project

```bash
# Run both Backend and Frontend concurrently (from root)
npm start

# OR run separately:

# Backend (Port 3001)
cd backend && npm run dev

# Frontend (Port 3000)
cd front && npm run dev
```

Visit **http://localhost:3000** to see the application.

---

## 🔑 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@ocean.com` | `Admin123!` |
| **User** | (Register new account) | - |

> ⚠️ **Change the admin password immediately after first login!**

---

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [Implementation Plan](./docs/implementation_plan.md)
- [Auth Architecture](./docs/auth_implementation_plan.md)
- [Walkthrough](./docs/walkthrough.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

---

## 🔒 Security Vulnerability Fixes (Recent Updates)

1.  **Critical**: Consolidated admin account creation logic.
2.  **High**: Implemented `requireAuth` on Dashboard APIs.
3.  **High**: Enforced strict JWT secret validation in production.
4.  **High**: Removed API keys from client-side bundles.
5.  **Medium**: Added URL validation for external menu links.
6.  **Low**: Implemented global Rate Limiting and Helmet security headers.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
