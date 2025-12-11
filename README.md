# AI-ERP Finance System - Frontend

![Landing Page](./public/landing-page.png)

A modern, AI-powered ERP Finance System designed specifically for the construction industry. This is the frontend application built with React, TypeScript, and Tailwind CSS.

## 🔗 Related Repository

- **Backend API**: [https://github.com/ALANAK777/ERP-Finance-System-Backend](https://github.com/ALANAK777/ERP-Finance-System-Backend)

## ✨ Features

### 📊 Dashboard
- Real-time financial KPIs and metrics
- Revenue and expense tracking
- Project status overview
- Interactive charts and visualizations

### 🏗️ Project Management
- Project progress tracking with visual indicators
- Budget monitoring and analysis
- Timeline management
- Progress update functionality

### 💰 Finance Module
- **Accounts**: Chart of accounts management
- **Journal Entries**: Double-entry bookkeeping
- **Invoices**: Customer invoices and vendor bills
- **Payments**: Payment recording and tracking
- **Vendors & Customers**: Contact management
- **Financial Reports**: Balance Sheet, Income Statement, Cash Flow

### 🤖 AI Insights
- Risk analysis and scoring
- Cash flow forecasting
- Project health monitoring
- Predictive analytics

### 👥 Administration
- User management
- Role-based access control
- Audit logs

## 🛠️ Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios

## 📦 Installation

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ALANAK777/ERP-Finance-System-Frontend.git
cd ERP-Finance-System-Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend URL:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🚀 Deployment (Vercel)

1. Push your code to GitHub

2. Import the project in Vercel

3. Set environment variables:
   - `VITE_API_URL` = Your backend Vercel URL (e.g., `https://your-backend.vercel.app/api`)

4. Deploy!

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── docs/                # Documentation & images
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── layout/      # App layout components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── auth/        # Login/Register pages
│   │   ├── dashboard/   # Dashboard page
│   │   ├── finance/     # Finance module pages
│   │   ├── insights/    # AI Insights page
│   │   └── projects/    # Projects page
│   ├── services/        # API service functions
│   ├── store/           # Zustand stores
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── .env.example         # Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json          # Vercel deployment config
└── vite.config.ts
```

## 🔐 Authentication

The app uses JWT-based authentication:
- Tokens are stored in localStorage
- Automatic token refresh on API calls
- Protected routes redirect to login

### Demo Credentials
```
Email: admin@erp.com
Password: admin123
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Theme support (via next-themes)
- **Toast Notifications**: User feedback with Sonner
- **Loading States**: Skeleton loaders and spinners
- **Form Validation**: Real-time validation with Zod

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**ALANAK777**

- GitHub: [@ALANAK777](https://github.com/ALANAK777)
