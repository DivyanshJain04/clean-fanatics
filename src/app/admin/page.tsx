'use client';

import { useEffect, useState } from 'react';
import BookingCard from '@/components/BookingCard';
import EventLog from '@/components/EventLog';
import StatusBadge from '@/components/StatusBadge';
import { SERVICE_TYPE_LABELS, STATUS_CONFIG, type Booking, type BookingEvent, type Provider, type BookingStatus } from '@/types';

type ViewMode = 'bookings' | 'events';

export default function AdminPanel() {
    const [viewMode, setViewMode] = useState<ViewMode>('bookings');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [events, setEvents] = useState<(BookingEvent & { customer_name?: string; provider_name?: string })[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'assign' | 'override'>('assign');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('pending');
    const [selectedProvider, setSelectedProvider] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, eventsRes, providersRes] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/events?limit=100'),
                fetch('/api/providers'),
            ]);

            const [bookingsData, eventsData, providersData] = await Promise.all([
                bookingsRes.json(),
                eventsRes.json(),
                providersRes.json(),
            ]);

            if (bookingsData.success) setBookings(bookingsData.data);
            if (eventsData.success) setEvents(eventsData.data);
            if (providersData.success) setProviders(providersData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        if (action === 'assign') {
            setSelectedBooking(booking);
            setModalType('assign');
            setSelectedProvider('');
            setShowModal(true);
            return;
        }

        if (action === 'override') {
            setSelectedBooking(booking);
            setModalType('override');
            setSelectedStatus(booking.status as BookingStatus);
            setShowModal(true);
            return;
        }

        if (action === 'cancel') {
            await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'cancelled',
                    actor_type: 'admin',
                    actor_id: 'admin',
                    is_admin: true,
                }),
            });
            await fetchData();
        }
    };

    const handleModalSubmit = async () => {
        if (!selectedBooking) return;

        try {
            if (modalType === 'assign') {
                await fetch(`/api/bookings/${selectedBooking.id}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider_id: selectedProvider || undefined,
                        actor_id: 'admin',
                    }),
                });
            } else if (modalType === 'override') {
                await fetch(`/api/bookings/${selectedBooking.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: selectedStatus,
                        actor_type: 'admin',
                        actor_id: 'admin',
                        is_admin: true,
                    }),
                });
            }

            setShowModal(false);
            await fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredBookings = statusFilter === 'all'
        ? bookings
        : bookings.filter(b => b.status === statusFilter);

    const getStats = () => ({
        total: bookings.length,
        pending: bookings.filter(b => ['pending', 'assigned'].includes(b.status)).length,
        active: bookings.filter(b => ['accepted', 'in_progress'].includes(b.status)).length,
        completed: bookings.filter(b => b.status === 'completed').length,
        failed: bookings.filter(b => ['cancelled', 'rejected', 'no_show', 'failed'].includes(b.status)).length,
    });

    const stats = getStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Admin Panel</h1>
                    <p className="page-subtitle">Manage bookings, override statuses, and view system events</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchData}>
                    ↻ Refresh
                </button>
            </header>

            <div className="page-content">
                {/* Stats */}
                <div className="grid-stats mb-lg">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--status-warning)' }}>{stats.pending}</div>
                        <div className="stat-label">Pending / Assigned</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--status-info)' }}>{stats.active}</div>
                        <div className="stat-label">Active</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--status-success)' }}>{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--status-error)' }}>{stats.failed}</div>
                        <div className="stat-label">Cancelled / Failed</div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="tabs">
                    <button
                        className={`tab ${viewMode === 'bookings' ? 'active' : ''}`}
                        onClick={() => setViewMode('bookings')}
                    >
                        📋 All Bookings
                    </button>
                    <button
                        className={`tab ${viewMode === 'events' ? 'active' : ''}`}
                        onClick={() => setViewMode('events')}
                    >
                        📊 Event Log ({events.length})
                    </button>
                </div>

                {viewMode === 'bookings' ? (
                    <>
                        {/* Status Filter */}
                        <div className="card mb-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="card-title">Filter Bookings</h3>
                                </div>
                                <select
                                    className="form-select"
                                    style={{ width: 'auto', minWidth: '200px' }}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    {Object.keys(STATUS_CONFIG).map((status) => (
                                        <option key={status} value={status}>
                                            {STATUS_CONFIG[status as BookingStatus].label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Bookings Table */}
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Service</th>
                                        <th>Customer</th>
                                        <th>Provider</th>
                                        <th>Status</th>
                                        <th>Scheduled</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="font-mono">#{booking.id.slice(0, 8)}</td>
                                            <td>{SERVICE_TYPE_LABELS[booking.service_type as keyof typeof SERVICE_TYPE_LABELS]}</td>
                                            <td>{booking.customer_name || 'N/A'}</td>
                                            <td>{booking.provider_name || <span className="text-secondary">Unassigned</span>}</td>
                                            <td><StatusBadge status={booking.status as BookingStatus} /></td>
                                            <td>{new Date(booking.scheduled_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="flex gap-sm">
                                                    {!booking.provider_id && !['completed', 'cancelled'].includes(booking.status) && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleAction('assign', booking.id)}
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                    {!['completed', 'cancelled'].includes(booking.status) && (
                                                        <>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => handleAction('override', booking.id)}
                                                            >
                                                                Override
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleAction('cancel', booking.id)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">System Event Log</h3>
                                <p className="card-subtitle">Complete history of all booking state changes</p>
                            </div>
                        </div>
                        <EventLog events={events} showBookingInfo />
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedBooking && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalType === 'assign' ? 'Assign Provider' : 'Override Status'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary mb-lg">
                                Booking #{selectedBooking.id.slice(0, 8)} - {SERVICE_TYPE_LABELS[selectedBooking.service_type as keyof typeof SERVICE_TYPE_LABELS]}
                            </p>

                            {modalType === 'assign' ? (
                                <div className="form-group">
                                    <label className="form-label">Select Provider</label>
                                    <select
                                        className="form-select"
                                        value={selectedProvider}
                                        onChange={(e) => setSelectedProvider(e.target.value)}
                                    >
                                        <option value="">Auto-assign (random available)</option>
                                        {providers
                                            .filter(p => p.service_type === selectedBooking.service_type)
                                            .map((provider) => (
                                                <option key={provider.id} value={provider.id}>
                                                    {provider.name} {provider.is_available ? '(Available)' : '(Unavailable)'}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">New Status (Admin Override)</label>
                                    <select
                                        className="form-select"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as BookingStatus)}
                                    >
                                        {Object.keys(STATUS_CONFIG).map((status) => (
                                            <option key={status} value={status}>
                                                {STATUS_CONFIG[status as BookingStatus].label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-secondary mt-sm" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        ⚠️ Admin overrides bypass normal status transition rules.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleModalSubmit}>
                                {modalType === 'assign' ? 'Assign Provider' : 'Override Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
