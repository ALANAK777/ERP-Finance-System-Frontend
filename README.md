# AI-ERP Finance System - Backend

A robust RESTful API backend for the AI-ERP Finance System, designed for the construction industry. Built with Node.js, Express, TypeScript, and Prisma ORM.

## 🔗 Related Repository

- **Frontend App**: [https://github.com/ALANAK777/ERP-Finance-System-Frontend](https://github.com/ALANAK777/ERP-Finance-System-Frontend)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Finance Manager, Project Manager)
- Secure password hashing with bcrypt

### 💰 Financial Management
- **Chart of Accounts**: Full account management (Assets, Liabilities, Equity, Revenue, Expenses)
- **Double-Entry Bookkeeping**: Automatic journal entries with balanced debits/credits
- **Invoicing**: Customer invoices and vendor bills with automatic accounting entries
- **Payments**: Payment recording with automatic account balance updates

### 🏗️ Project Management
- Project CRUD operations
- Progress tracking with historical data
- Budget monitoring
- Revenue recognition on project completion

### 🤖 AI-Powered Insights
- Risk score calculation
- Cash flow forecasting
- Project health analysis
- Predictive analytics

### 📊 Financial Reporting
- Balance Sheet generation
- Income Statement
- Cash Flow Statement
- Trial Balance

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Language**: TypeScript 5
- **ORM**: Prisma 5
- **Database**: PostgreSQL (Neon DB)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL database (or Neon DB account)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ALANAK777/ERP-Finance-System-Backend.git
cd ERP-Finance-System-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# Database - Neon DB (PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Seed the database (optional):
```bash
npm run seed
```

8. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 🚀 Deployment (Vercel)

1. Push your code to GitHub

2. Import the project in Vercel

3. Set environment variables:
   - `DATABASE_URL` = Your Neon DB connection string
   - `JWT_SECRET` = A secure random string
   - `JWT_EXPIRES_IN` = `7d`
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = Your frontend Vercel URL

4. Deploy!

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Database seeding
│   └── migrations/      # Database migrations
├── src/
│   ├── controllers/     # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── account.controller.ts
│   │   ├── invoice.controller.ts
│   │   ├── journal.controller.ts
│   │   ├── project.controller.ts
│   │   ├── insights.controller.ts
│   │   └── ...
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/          # API routes
│   ├── validators/      # Zod validation schemas
│   ├── lib/             # Utilities (Prisma client)
│   └── app.ts           # Express app entry
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── vercel.json          # Vercel deployment config
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account |
| GET | `/api/accounts/:id` | Get account by ID |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |

### Journal Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal-entries` | List entries |
| POST | `/api/journal-entries` | Create entry |
| GET | `/api/journal-entries/:id` | Get entry |
| PUT | `/api/journal-entries/:id` | Update entry |
| POST | `/api/journal-entries/:id/post` | Post entry |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| POST | `/api/invoices/:id/payments` | Record payment |
| GET | `/api/invoices/:id/payments` | Get payments |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| POST | `/api/projects/:id/progress` | Add progress |

### AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/risk-analysis` | Get risk analysis |
| GET | `/api/insights/cash-forecast` | Get cash forecast |
| GET | `/api/insights/project-health` | Get project health |
| GET | `/api/insights/risk-score/:projectId` | Get project risk |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/balance-sheet` | Balance Sheet |
| GET | `/api/reports/income-statement` | Income Statement |
| GET | `/api/reports/cash-flow` | Cash Flow Statement |
| GET | `/api/reports/trial-balance` | Trial Balance |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check |

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Seed the database |

## 🔒 Security Features

- **Helmet**: HTTP security headers
- **CORS**: Cross-origin resource sharing
- **JWT**: Secure token-based auth
- **bcrypt**: Password hashing
- **Zod**: Input validation

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**ALANAK777**

- GitHub: [@ALANAK777](https://github.com/ALANAK777)
