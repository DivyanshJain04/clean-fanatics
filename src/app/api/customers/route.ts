import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import type { Customer } from '@/types';

let seeded = false;
function ensureSeeded() {
    if (!seeded) {
        seedDatabase();
        seeded = true;
    }
}

// GET /api/customers - List all customers
export async function GET() {
    try {
        ensureSeeded();
        const db = getDatabase();

        const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all() as Customer[];

        return NextResponse.json({ success: true, data: customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.email || !body.phone) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingCustomer = db.prepare('SELECT id FROM customers WHERE email = ?').get(body.email);
        if (existingCustomer) {
            return NextResponse.json(
                { success: false, error: 'Customer with this email already exists' },
                { status: 409 }
            );
        }

        const customerId = uuidv4();
        const now = new Date().toISOString();

        // Create the customer
        db.prepare(`
            INSERT INTO customers (id, name, email, phone, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(customerId, body.name, body.email, body.phone, now);

        const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);

        return NextResponse.json({
            success: true,
            data: newCustomer,
            message: 'Customer registered successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create customer' },
            { status: 500 }
        );
    }
}
