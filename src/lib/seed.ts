import { getDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';

export function seedDatabase() {
    const db = getDatabase();

    // Check if data already exists
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
    if (customerCount.count > 0) {
        console.log('Database already seeded, skipping...');
        return;
    }

    console.log('Seeding database with sample data...');

    // Seed customers
    const customers = [
        { id: uuidv4(), name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-0101' },
        { id: uuidv4(), name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1-555-0102' },
        { id: uuidv4(), name: 'Michael Brown', email: 'mike.brown@email.com', phone: '+1-555-0103' },
        { id: uuidv4(), name: 'Emily Davis', email: 'emily.d@email.com', phone: '+1-555-0104' },
        { id: uuidv4(), name: 'David Wilson', email: 'david.w@email.com', phone: '+1-555-0105' },
    ];

    const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)
  `);

    for (const customer of customers) {
        insertCustomer.run(customer.id, customer.name, customer.email, customer.phone);
    }

    // Seed providers
    const providers = [
        { id: uuidv4(), name: 'CleanPro Services', email: 'cleanpro@services.com', phone: '+1-555-1001', service_type: 'cleaning', is_available: 1 },
        { id: uuidv4(), name: 'SparkleClean Co', email: 'sparkle@clean.com', phone: '+1-555-1002', service_type: 'cleaning', is_available: 1 },
        { id: uuidv4(), name: 'Mike\'s Plumbing', email: 'mike@plumbing.com', phone: '+1-555-2001', service_type: 'plumbing', is_available: 1 },
        { id: uuidv4(), name: 'QuickFix Plumbers', email: 'quick@plumbers.com', phone: '+1-555-2002', service_type: 'plumbing', is_available: 0 },
        { id: uuidv4(), name: 'PowerUp Electricians', email: 'power@electric.com', phone: '+1-555-3001', service_type: 'electrical', is_available: 1 },
        { id: uuidv4(), name: 'BrightSpark Electric', email: 'bright@spark.com', phone: '+1-555-3002', service_type: 'electrical', is_available: 1 },
        { id: uuidv4(), name: 'WoodCraft Carpentry', email: 'wood@craft.com', phone: '+1-555-4001', service_type: 'carpentry', is_available: 1 },
        { id: uuidv4(), name: 'ColorMaster Painters', email: 'color@master.com', phone: '+1-555-5001', service_type: 'painting', is_available: 1 },
        { id: uuidv4(), name: 'GreenThumb Gardens', email: 'green@thumb.com', phone: '+1-555-6001', service_type: 'gardening', is_available: 1 },
        { id: uuidv4(), name: 'FixIt Appliances', email: 'fixit@appliances.com', phone: '+1-555-7001', service_type: 'appliance_repair', is_available: 1 },
    ];

    const insertProvider = db.prepare(`
    INSERT INTO providers (id, name, email, phone, service_type, is_available) VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (const provider of providers) {
        insertProvider.run(provider.id, provider.name, provider.email, provider.phone, provider.service_type, provider.is_available);
    }

    // Create a few sample bookings
    const sampleCustomers = db.prepare('SELECT id FROM customers LIMIT 3').all() as { id: string }[];
    const sampleProviders = db.prepare('SELECT id, service_type FROM providers WHERE is_available = 1 LIMIT 3').all() as { id: string; service_type: string }[];

    const bookings = [
        {
            id: uuidv4(),
            customer_id: sampleCustomers[0]?.id,
            provider_id: sampleProviders[0]?.id,
            service_type: sampleProviders[0]?.service_type || 'cleaning',
            status: 'completed',
            scheduled_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            address: '123 Main St, Apt 4B, New York, NY 10001',
            notes: 'Deep cleaning requested',
        },
        {
            id: uuidv4(),
            customer_id: sampleCustomers[1]?.id,
            provider_id: sampleProviders[1]?.id,
            service_type: sampleProviders[1]?.service_type || 'plumbing',
            status: 'in_progress',
            scheduled_at: new Date().toISOString(),
            address: '456 Oak Ave, Brooklyn, NY 11201',
            notes: 'Leaky faucet in kitchen',
        },
        {
            id: uuidv4(),
            customer_id: sampleCustomers[2]?.id,
            provider_id: null,
            service_type: 'electrical',
            status: 'pending',
            scheduled_at: new Date(Date.now() + 86400000).toISOString(),
            address: '789 Pine Rd, Queens, NY 11375',
            notes: 'Install new ceiling fan',
        },
    ];

    const insertBooking = db.prepare(`
    INSERT INTO bookings (id, customer_id, provider_id, service_type, status, scheduled_at, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const insertEvent = db.prepare(`
    INSERT INTO booking_events (id, booking_id, event_type, old_status, new_status, actor_type, actor_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const booking of bookings) {
        if (booking.customer_id) {
            insertBooking.run(
                booking.id,
                booking.customer_id,
                booking.provider_id,
                booking.service_type,
                booking.status,
                booking.scheduled_at,
                booking.address,
                booking.notes
            );

            // Add creation event
            insertEvent.run(
                uuidv4(),
                booking.id,
                'booking_created',
                null,
                'pending',
                'customer',
                booking.customer_id,
                null
            );

            // Add status change events for non-pending bookings
            if (booking.status !== 'pending' && booking.provider_id) {
                insertEvent.run(
                    uuidv4(),
                    booking.id,
                    'provider_assigned',
                    'pending',
                    'assigned',
                    'system',
                    'auto-assign',
                    JSON.stringify({ provider_id: booking.provider_id })
                );

                insertEvent.run(
                    uuidv4(),
                    booking.id,
                    'provider_accepted',
                    'assigned',
                    'accepted',
                    'provider',
                    booking.provider_id,
                    null
                );

                if (booking.status === 'in_progress' || booking.status === 'completed') {
                    insertEvent.run(
                        uuidv4(),
                        booking.id,
                        'status_changed',
                        'accepted',
                        'in_progress',
                        'provider',
                        booking.provider_id,
                        null
                    );
                }

                if (booking.status === 'completed') {
                    insertEvent.run(
                        uuidv4(),
                        booking.id,
                        'status_changed',
                        'in_progress',
                        'completed',
                        'provider',
                        booking.provider_id,
                        null
                    );
                }
            }
        }
    }

    console.log('Database seeded successfully!');
    console.log(`- ${customers.length} customers created`);
    console.log(`- ${providers.length} providers created`);
    console.log(`- ${bookings.length} sample bookings created`);
}
