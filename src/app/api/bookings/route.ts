import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuidv4 } from 'uuid';
import type { Booking, CreateBookingRequest, BookingStatus } from '@/types';

// Ensure database is seeded on first request
let seeded = false;
function ensureSeeded() {
    if (!seeded) {
        seedDatabase();
        seeded = true;
    }
}

// GET /api/bookings - List all bookings with optional filters
export async function GET(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const { searchParams } = new URL(request.url);

        const customerId = searchParams.get('customer_id');
        const providerId = searchParams.get('provider_id');
        const status = searchParams.get('status');

        let query = `
      SELECT 
        b.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        p.name as provider_name,
        p.email as provider_email,
        p.phone as provider_phone
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN providers p ON b.provider_id = p.id
      WHERE 1=1
    `;
        const params: string[] = [];

        if (customerId) {
            query += ' AND b.customer_id = ?';
            params.push(customerId);
        }
        if (providerId) {
            query += ' AND b.provider_id = ?';
            params.push(providerId);
        }
        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.created_at DESC';

        const bookings = db.prepare(query).all(...params) as Booking[];

        return NextResponse.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch bookings' },
            { status: 500 }
        );
    }
}

// POST /api/bookings - Create a new booking
export async function POST(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const body: CreateBookingRequest = await request.json();

        // Validate required fields
        if (!body.customer_id || !body.service_type || !body.scheduled_at || !body.address) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify customer exists
        const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(body.customer_id);
        if (!customer) {
            return NextResponse.json(
                { success: false, error: 'Customer not found' },
                { status: 404 }
            );
        }

        const bookingId = uuidv4();
        const now = new Date().toISOString();

        // Create the booking
        db.prepare(`
      INSERT INTO bookings (id, customer_id, service_type, status, scheduled_at, address, notes, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(bookingId, body.customer_id, body.service_type, body.scheduled_at, body.address, body.notes || null, now, now);

        // Log the creation event
        db.prepare(`
      INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
      VALUES (?, ?, 'booking_created', NULL, 'pending', 'customer', ?, NULL)
    `).run(uuidv4(), bookingId, body.customer_id);

        // Try auto-assignment
        const autoAssignResult = await autoAssignProvider(db, bookingId, body.service_type);

        // Fetch the created booking with joins
        const booking = db.prepare(`
      SELECT 
        b.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        p.name as provider_name,
        p.email as provider_email,
        p.phone as provider_phone
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN providers p ON b.provider_id = p.id
      WHERE b.id = ?
    `).get(bookingId) as Booking;

        return NextResponse.json({
            success: true,
            data: booking,
            message: autoAssignResult.success
                ? 'Booking created and provider assigned'
                : 'Booking created, awaiting provider assignment'
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}

// Auto-assign provider logic
async function autoAssignProvider(db: ReturnType<typeof getDatabase>, bookingId: string, serviceType: string) {
    // Find available providers for this service type
    const provider = db.prepare(`
    SELECT * FROM providers 
    WHERE service_type = ? AND is_available = 1
    ORDER BY RANDOM() 
    LIMIT 1
  `).get(serviceType) as { id: string } | undefined;

    if (!provider) {
        // Log assignment failure
        db.prepare(`
      INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
      VALUES (?, ?, 'assignment_failed', 'pending', 'pending', 'system', 'auto-assign', ?)
    `).run(uuidv4(), bookingId, JSON.stringify({ reason: 'No available providers' }));

        return { success: false, retry: true };
    }

    const now = new Date().toISOString();

    // Assign the provider
    db.prepare(`
    UPDATE bookings 
    SET provider_id = ?, status = 'assigned', updated_at = ?
    WHERE id = ?
  `).run(provider.id, now, bookingId);

    // Log the assignment
    db.prepare(`
    INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
    VALUES (?, ?, 'provider_assigned', 'pending', 'assigned', 'system', 'auto-assign', ?)
  `).run(uuidv4(), bookingId, JSON.stringify({ provider_id: provider.id }));

    return { success: true };
}
