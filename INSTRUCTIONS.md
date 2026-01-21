# Clean Fanatics - Project Setup & Running Instructions

## Quick Start Guide

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)
- Git

---

## Installation Steps

### Step 1: Clone the Repository
```bash
git clone https://github.com/DivyanshJain04/clean-fanatics.git
cd clean-fanatics
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Navigate to: **http://localhost:3000**

---

## Live Demo
**https://clean-fanatics.vercel.app/**

---

## User Access

| Role | How to Access |
|------|---------------|
| **Customer** | Click "I'm a Customer" → Login with any email + password `1234` |
| **Provider** | Click "I'm a Service Provider" → Login with any email + password `1234` |
| **Admin** | Click "Admin Panel" button (top-right corner) |

---

## Features Overview

### Customer Portal
- Book home services
- View booking history
- Cancel active bookings
- Register new account

### Provider Portal
- Accept/Reject assigned jobs
- Update job status
- Toggle availability

### Admin Panel
- View all bookings
- Manual provider assignment
- Status override
- Event audit log

---

## Technology Stack
- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** SQLite (better-sqlite3)
- **Styling:** Custom CSS

---

## Project Structure
```
src/
├── app/
│   ├── page.tsx          # Homepage
│   ├── customer/         # Customer dashboard
│   ├── provider/         # Provider dashboard
│   ├── admin/            # Admin panel
│   └── api/              # API routes
├── components/           # UI components
├── lib/                  # Database utilities
└── types/                # TypeScript types
```

---

## Support
For any issues, please refer to the GitHub repository:
https://github.com/DivyanshJain04/clean-fanatics
