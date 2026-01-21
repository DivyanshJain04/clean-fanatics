import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import type { Provider } from '@/types';

let seeded = false;
function ensureSeeded() {
    if (!seeded) {
        seedDatabase();
        seeded = true;
    }
}

// GET /api/providers - List all providers with optional filters
export async function GET(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const { searchParams } = new URL(request.url);

        const serviceType = searchParams.get('service_type');
        const availableOnly = searchParams.get('available') === 'true';

        let query = 'SELECT * FROM providers WHERE 1=1';
        const params: (string | number)[] = [];

        if (serviceType) {
            query += ' AND service_type = ?';
            params.push(serviceType);
        }

        if (availableOnly) {
            query += ' AND is_available = 1';
        }

        query += ' ORDER BY name ASC';

        const providers = db.prepare(query).all(...params) as Provider[];

        return NextResponse.json({ success: true, data: providers });
    } catch (error) {
        console.error('Error fetching providers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch providers' },
            { status: 500 }
        );
    }
}

// POST /api/providers - Create a new provider
export async function POST(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const body = await request.json();

        // Validate required fields (Note: using 'name' for Company Name from frontend)
        if (!body.name || !body.email || !body.phone || !body.service_type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingProvider = db.prepare('SELECT id FROM providers WHERE email = ?').get(body.email);
        if (existingProvider) {
            return NextResponse.json(
                { success: false, error: 'Provider with this email already exists' },
                { status: 409 }
            );
        }

        const providerId = uuidv4();
        const now = new Date().toISOString();

        // Create the provider
        db.prepare(`
            INSERT INTO providers (id, name, email, phone, service_type, is_available, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
        `).run(providerId, body.name, body.email, body.phone, body.service_type, now);

        const newProvider = db.prepare('SELECT * FROM providers WHERE id = ?').get(providerId);

        return NextResponse.json({
            success: true,
            data: newProvider,
            message: 'Provider registered successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating provider:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create provider' },
            { status: 500 }
        );
    }
}

// PATCH /api/providers - Update provider availability
export async function PATCH(request: Request) {
    try {
        ensureSeeded();
        const db = getDatabase();
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'Provider ID required' },
                { status: 400 }
            );
        }

        const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(body.id);
        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        if (body.is_available !== undefined) {
            db.prepare('UPDATE providers SET is_available = ? WHERE id = ?')
                .run(body.is_available ? 1 : 0, body.id);
        }

        const updatedProvider = db.prepare('SELECT * FROM providers WHERE id = ?').get(body.id);

        return NextResponse.json({
            success: true,
            data: updatedProvider,
            message: 'Provider updated successfully'
        });
    } catch (error) {
        console.error('Error updating provider:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update provider' },
            { status: 500 }
        );
    }
}
