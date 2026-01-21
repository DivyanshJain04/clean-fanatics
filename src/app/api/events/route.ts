import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import type { BookingEvent } from '@/types';

let seeded = false;
function ensureSeeded() {
    if (!seeded) {
        seedDatabase();
        seeded = true;
    }
}

// GET /api/events - Get event log with optional filters
export async function GET(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const { searchParams } = new URL(request.url);

        const bookingId = searchParams.get('booking_id');
        const eventType = searchParams.get('event_type');
        const actorType = searchParams.get('actor_type');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = `
      SELECT 
        e.*,
        b.service_type,
        b.address,
        c.name as customer_name,
        p.name as provider_name
      FROM booking_events e
      LEFT JOIN bookings b ON e.booking_id = b.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN providers p ON b.provider_id = p.id
      WHERE 1=1
    `;
        const params: (string | number)[] = [];

        if (bookingId) {
            query += ' AND e.booking_id = ?';
            params.push(bookingId);
        }

        if (eventType) {
            query += ' AND e.event_type = ?';
            params.push(eventType);
        }

        if (actorType) {
            query += ' AND e.actor_type = ?';
            params.push(actorType);
        }

        query += ' ORDER BY e.created_at DESC LIMIT ?';
        params.push(limit);

        const events = db.prepare(query).all(...params);

        return NextResponse.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
