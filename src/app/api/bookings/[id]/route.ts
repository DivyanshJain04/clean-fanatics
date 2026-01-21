import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuidv4 } from 'uuid';
import type { Booking, UpdateBookingRequest, BookingStatus } from '@/types';

let seeded = false;
function ensureSeeded() {
    if (!seeded) {
        seedDatabase();
        seeded = true;
    }
}

// Valid status transitions
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ['assigned', 'cancelled'],
    assigned: ['accepted', 'rejected', 'cancelled'],
    accepted: ['in_progress', 'no_show', 'cancelled'],
    rejected: ['pending', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: ['pending', 'cancelled'],
    failed: ['pending', 'cancelled'],
};

// GET /api/bookings/[id] - Get single booking with events
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        ensureSeeded();
        const db = getDatabase();

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
    `).get(params.id) as Booking | undefined;

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Get event history
        const events = db.prepare(`
      SELECT * FROM booking_events 
      WHERE booking_id = ? 
      ORDER BY created_at ASC
    `).all(params.id);

        return NextResponse.json({
            success: true,
            data: { ...booking, events }
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch booking' },
            { status: 500 }
        );
    }
}

// PATCH /api/bookings/[id] - Update booking status or details
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const body: UpdateBookingRequest & { actor_type?: string; actor_id?: string; is_admin?: boolean } = await request.json();

        // Get current booking
        const currentBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(params.id) as Booking | undefined;

        if (!currentBooking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        // Handle status change
        if (body.status && body.status !== currentBooking.status) {
            const isAdmin = body.is_admin === true;

            // Validate transition (admins can override)
            if (!isAdmin && !VALID_TRANSITIONS[currentBooking.status as BookingStatus]?.includes(body.status)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Invalid status transition from '${currentBooking.status}' to '${body.status}'`
                    },
                    { status: 400 }
                );
            }

            updates.push('status = ?');
            values.push(body.status);

            // Log the status change event
            const eventType = body.status === 'cancelled' ? 'booking_cancelled' :
                body.status === 'no_show' ? 'no_show_reported' :
                    isAdmin ? 'manual_override' : 'status_changed';

            db.prepare(`
        INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                uuidv4(),
                params.id,
                eventType,
                currentBooking.status,
                body.status,
                body.actor_type || 'system',
                body.actor_id || 'unknown',
                isAdmin ? JSON.stringify({ admin_override: true }) : null
            );

            // Handle retry logic for rejected/no_show bookings
            if ((body.status === 'rejected' || body.status === 'no_show') && currentBooking.retry_count < 3) {
                // Schedule retry - set back to pending and remove provider assignment
                updates.push('retry_count = ?');
                values.push(currentBooking.retry_count + 1);

                // Override the status update that was just pushed above
                // We want to force it to 'pending' instead of 'rejected'/'no_show'
                // and clear the provider_id
                const statusIndex = updates.indexOf('status = ?');
                if (statusIndex !== -1) {
                    values[statusIndex + 1] = 'pending'; // +1 because values matches updates index but shifted?? No, values parallels updates
                    // Actually, values array corresponds to updates array order.
                    // We pushed 'status = ?' at index X, so values[X] is the status.
                    // Let's just find the index of the value we added for status.
                    // The status was added first in the previous block.
                    // Let's be safer and just append the override to the updates list, 
                    // but SQL might complain about setting status twice.
                    // Instead, let's modify the arrays directly if we can, or just handle this logic BEFORE pushing the status update?
                    // Refactoring slightly to handle this header logic would be cleaner, but constrained to this block:

                    // We already pushed 'status = ?' and 'body.status'. 
                    // Let's remove them and replace with our retry logic
                    updates.pop(); // Remove status = ?
                    values.pop(); // Remove body.status

                    updates.push('status = ?');
                    values.push('pending');

                    updates.push('provider_id = ?');
                    values.push(null); // Clear provider
                }

                db.prepare(`
          INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
          VALUES (?, ?, 'retry_triggered', ?, 'pending', 'system', 'retry-logic', ?)
        `).run(
                    uuidv4(),
                    params.id,
                    body.status, // The "event" was rejection, but new status is pending
                    JSON.stringify({
                        retry_count: currentBooking.retry_count + 1,
                        previous_provider: currentBooking.provider_id,
                        reason: body.status
                    })
                );
            }
        }

        // Handle provider assignment
        if (body.provider_id !== undefined) {
            updates.push('provider_id = ?');
            values.push(body.provider_id || '');
        }

        // Handle notes update
        if (body.notes !== undefined) {
            updates.push('notes = ?');
            values.push(body.notes);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No valid updates provided' },
                { status: 400 }
            );
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(params.id);

        db.prepare(`
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

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
    `).get(params.id) as Booking;

        return NextResponse.json({
            success: true,
            data: updatedBooking,
            message: 'Booking updated successfully'
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update booking' },
            { status: 500 }
        );
    }
}
