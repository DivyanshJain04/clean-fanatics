'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BookingCard from '@/components/BookingCard';
import { type Booking, type Customer } from '@/types';

export default function CustomerPage() {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get current customer from session
        const customerId = sessionStorage.getItem('currentCustomerId');
        if (!customerId) {
            // Redirect to login if no customer session
            window.location.href = '/';
            return;
        }

        fetchCustomerData(customerId);
    }, []);

    const fetchCustomerData = async (customerId: string) => {
        try {
            // Fetch customer details
            const customersRes = await fetch('/api/customers');
            const customersData = await customersRes.json();

            if (customersData.success) {
                const currentCustomer = customersData.data.find((c: Customer) => c.id === customerId);
                if (currentCustomer) {
                    setCustomer(currentCustomer);

                    // Fetch their bookings
                    const bookingsRes = await fetch(`/api/bookings?customer_id=${customerId}`);
                    const bookingsData = await bookingsRes.json();

                    if (bookingsData.success) {
                        setBookings(bookingsData.data);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'cancelled',
                    actor_type: 'customer',
                    actor_id: customer?.id,
                }),
            });

            // Refresh bookings
            if (customer) {
                fetchCustomerData(customer.id);
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('currentCustomerId');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    const activeBookings = bookings.filter(b =>
        !['completed', 'cancelled', 'rejected', 'no_show', 'failed'].includes(b.status)
    );
    const pastBookings = bookings.filter(b =>
        ['completed', 'cancelled', 'rejected', 'no_show', 'failed'].includes(b.status)
    );

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Welcome, {customer.name.split(' ')[0]}!</h1>
                    <p className="page-subtitle">Manage your home service bookings</p>
                </div>
                <div className="flex gap-md">
                    <Link href="/customer/book" className="btn btn-primary">
                        + New Booking
                    </Link>
                </div>
            </header>

            <div className="page-content">
                {/* Customer Info Card */}
                <div className="card mb-lg">
                    <div className="flex items-center gap-lg">
                        <div className="user-avatar-lg">👤</div>
                        <div>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{customer.name}</h3>
                            <p className="text-secondary">{customer.email}</p>
                            <p className="text-secondary">{customer.phone}</p>
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={handleLogout}>
                            Switch Account
                        </button>
                    </div>
                </div>

                {/* Active Bookings */}
                <div className="section-header" style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
                    <h2 className="section-title">Active Bookings ({activeBookings.length})</h2>
                    <p className="section-subtitle">Your upcoming and in-progress services</p>
                </div>

                {activeBookings.length === 0 ? (
                    <div className="card mb-lg">
                        <div className="empty-state">
                            <div className="empty-state-icon">📅</div>
                            <div className="empty-state-title">No Active Bookings</div>
                            <div className="empty-state-text">You don't have any upcoming services scheduled.</div>
                            <Link href="/customer/book" className="btn btn-primary">
                                Book a Service
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid-cards mb-lg">
                        {activeBookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                actorType="customer"
                                onAction={(action, id) => {
                                    if (action === 'cancel') {
                                        handleCancelBooking(id);
                                    }
                                }}
                                showActions
                            />
                        ))}
                    </div>
                )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                    <>
                        <div className="section-header" style={{ textAlign: 'left', marginBottom: 'var(--space-lg)', marginTop: 'var(--space-2xl)' }}>
                            <h2 className="section-title">Past Bookings ({pastBookings.length})</h2>
                            <p className="section-subtitle">Your booking history</p>
                        </div>

                        <div className="grid-cards">
                            {pastBookings.map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    actorType="customer"
                                    showActions={false}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
