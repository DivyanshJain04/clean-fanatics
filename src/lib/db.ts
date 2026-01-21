import Database from 'better-sqlite3';
import path from 'path';

// Database singleton
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
    if (!db) {
        const dbPath = path.join(process.cwd(), 'data', 'bookings.db');
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        initializeSchema(db);
    }
    return db;
}

function initializeSchema(database: Database.Database) {
    // Create customers table
    database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

    // Create providers table
    database.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      service_type TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

    // Create bookings table
    database.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      provider_id TEXT,
      service_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_at TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (provider_id) REFERENCES providers(id)
    )
  `);

    // Create booking_events table for observability
    database.exec(`
    CREATE TABLE IF NOT EXISTS booking_events (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      actor_type TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

    // Create indexes for better query performance
    database.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_events_booking ON booking_events(booking_id);
    CREATE INDEX IF NOT EXISTS idx_providers_service ON providers(service_type);
    CREATE INDEX IF NOT EXISTS idx_providers_available ON providers(is_available);
  `);
}

// Helper function to close database (for cleanup)
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
