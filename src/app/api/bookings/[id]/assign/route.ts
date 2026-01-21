import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuidv4 } from 'uuid';

let seeded = false;
function ensureSeeded() {
    if (!seeded) {
        seedDatabase();
        seeded = true;
    }
}

// POST /api/bookings/[id]/assign - Assign provider (auto or manual)
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const body = await request.json().catch(() => ({}));

        // Get current booking
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(params.id) as {
            id: string;
            status: string;
            service_type: string;
            provider_id: string | null;
        } | undefined;

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Only allow assignment for pending bookings
        if (booking.status !== 'pending' && booking.status !== 'rejected' && booking.status !== 'no_show') {
            return NextResponse.json(
                { success: false, error: `Cannot assign provider to booking with status '${booking.status}'` },
                { status: 400 }
            );
        }

        let providerId = body.provider_id;
        const now = new Date().toISOString();

        // If no provider specified, auto-assign
        if (!providerId) {
            const provider = db.prepare(`
        SELECT id FROM providers 
        WHERE service_type = ? AND is_available = 1
        ORDER BY RANDOM() 
        LIMIT 1
      `).get(booking.service_type) as { id: string } | undefined;

            if (!provider) {
                // Log assignment failure
                db.prepare(`
          INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
          VALUES (?, ?, 'assignment_failed', ?, ?, 'system', 'auto-assign', ?)
        `).run(uuidv4(), params.id, booking.status, booking.status, JSON.stringify({ reason: 'No available providers' }));

                return NextResponse.json(
                    { success: false, error: 'No available providers for this service type' },
                    { status: 404 }
                );
            }

            providerId = provider.id;
        } else {
            // Verify manual provider exists and is available
            const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(providerId) as {
                id: string;
                is_available: number;
                service_type: string;
            } | undefined;

            if (!provider) {
                return NextResponse.json(
                    { success: false, error: 'Provider not found' },
                    { status: 404 }
                );
            }
        }

        // Assign the provider
        db.prepare(`
      UPDATE bookings 
      SET provider_id = ?, status = 'assigned', updated_at = ?
      WHERE id = ?
    `).run(providerId, now, params.id);

        // Log the assignment
        const isManual = !!body.provider_id;
        db.prepare(`
      INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
      VALUES (?, ?, 'provider_assigned', ?, 'assigned', ?, ?, ?)
    `).run(
            uuidv4(),
            params.id,
            booking.status,
            isManual ? 'admin' : 'system',
            isManual ? (body.actor_id || 'admin') : 'auto-assign',
            JSON.stringify({ provider_id: providerId, manual: isManual })
        );

        // Fetch updated booking
        const updatedBooking = db.prepare(`
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
    `).get(params.id);

        return NextResponse.json({
            success: true,
            data: updatedBooking,
            message: isManual ? 'Provider manually assigned' : 'Provider auto-assigned'
        });
    } catch (error) {
        console.error('Error assigning provider:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to assign provider' },
            { status: 500 }
        );
    }
}
