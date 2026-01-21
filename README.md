# Clean Fanatics - Home Services Booking Platform

A full-stack home services booking platform connecting customers with service providers for cleaning, plumbing, electrical, and other home maintenance services.

## 🚀 Live Demo

**Deploy Link:** [https://clean-fanatics.vercel.app/](https://clean-fanatics.vercel.app/)

## 📋 Features

### Customer Portal
- Browse and book home services (Cleaning, Plumbing, Electrical, Carpentry, Painting, Gardening)
- View booking history and status updates
- Cancel active bookings
- New customer registration

### Provider Portal
- Accept or reject assigned jobs
- Update job status (Start → Complete)
- Toggle availability
- View assigned bookings

### Admin Panel
- Dashboard with system statistics
- View all bookings with filtering
- Manual provider assignment
- Status override capabilities
- Full event audit log

## 🏗️ Design Decisions

### Technology Stack
| Choice | Reasoning |
|--------|-----------|
| **Next.js 14** | Full-stack React framework with API routes, SSR, and excellent DX |
| **SQLite (better-sqlite3)** | Zero-config embedded database, perfect for demos and prototyping |
| **TypeScript** | Type safety for complex booking state management |
| **CSS (Custom)** | Full control over styling without framework overhead |

### Architecture Decisions

#### 1. Session-Based Authentication (Simplified)
- **Trade-off:** Used `sessionStorage` instead of JWT/cookies for demo simplicity
- **Why:** Faster development cycle, easier testing, no token management
- **Production Alternative:** Implement NextAuth.js with proper session management

#### 2. SQLite for Data Persistence
- **Trade-off:** Single-file database vs. managed database service
- **Why:** Zero configuration, portable, works locally without external services
- **Production Alternative:** PostgreSQL with Prisma ORM on Supabase/Neon

#### 3. Auto-Assignment Algorithm
- **Current:** Random selection from available providers matching service type
- **Trade-off:** Simplicity over optimization
- **Future Enhancement:** Consider workload balancing, ratings, proximity

#### 4. Retry Logic for Rejected Bookings
- **Implementation:** Auto-reset to `pending` status, increment retry counter
- **Max Retries:** 3 attempts before marking as `failed`
- **Why:** Ensures customer requests don't get stuck due to single provider rejection

### State Machine for Booking Status

```
pending → assigned → accepted → in_progress → completed
                  ↘ rejected → pending (retry)
                  ↘ no_show → pending (retry)
                              ↘ failed (max retries exceeded)
```

## ⚠️ Trade-offs & Assumptions

### Assumptions
1. **Single Service Per Booking:** Each booking is for one service type only
2. **Simplified Password:** All users use password `1234` for demo purposes
3. **No Real-time Updates:** Polling/refresh required for status updates
4. **No Payment Integration:** Focus on booking workflow only

### Trade-offs Made
| Decision | Benefit | Cost |
|----------|---------|------|
| No real authentication | Faster demo setup | Not production-ready |
| SQLite instead of PostgreSQL | Zero config, portable | Limited concurrency |
| No WebSocket/SSE | Simpler architecture | Manual refresh needed |
| Inline styles for Admin link | Guaranteed visibility | Less maintainable CSS |

### Known Limitations
- No email notifications for booking updates
- No geolocation-based provider matching
- No payment processing
- Session lost on browser close

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/clean-fanatics.git
cd clean-fanatics

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
http://localhost:3000
```

### Project Structure

```
src/
├── app/
│   ├── page.tsx          # Homepage with login/register
│   ├── customer/         # Customer dashboard
│   ├── provider/         # Provider dashboard
│   ├── admin/            # Admin panel
│   └── api/              # API routes
│       ├── bookings/     # Booking CRUD + assignment
│       ├── customers/    # Customer management
│       ├── providers/    # Provider management
│       └── events/       # Audit log
├── components/           # Reusable UI components
├── lib/                  # Database & utilities
└── types/                # TypeScript definitions
```

## 📊 Database Schema

### Tables
- **customers** - User accounts for service requesters
- **providers** - Service provider accounts
- **bookings** - Service booking records with status tracking
- **booking_events** - Audit log for all booking changes

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy with default Next.js settings

**Note:** SQLite works with Vercel's serverless functions but data resets on redeployment. For persistent data, migrate to PostgreSQL.

### Environment Variables
None required for demo - all configuration is embedded.

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Register new customer |
| GET | `/api/providers` | List providers (with filters) |
| POST | `/api/providers` | Register new provider |
| GET | `/api/bookings` | List bookings (with filters) |
| POST | `/api/bookings` | Create new booking |
| PATCH | `/api/bookings/[id]` | Update booking status |
| POST | `/api/bookings/[id]/assign` | Assign provider to booking |
| GET | `/api/events` | Get audit log |

## 🧪 Testing

### Manual Testing Flow
1. **Customer Flow:**
   - Register as customer → Book service → View in dashboard
2. **Provider Flow:**
   - Register as provider → Accept job → Complete job
3. **Admin Flow:**
   - View all bookings → Manually assign → Override status

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | Any registered email | 1234 |
| Provider | Any registered email | 1234 |
| Admin | Direct link access | N/A |

## 📄 License

MIT License - Feel free to use and modify.

---

**Built with ❤️ using Next.js, TypeScript, and SQLite**
