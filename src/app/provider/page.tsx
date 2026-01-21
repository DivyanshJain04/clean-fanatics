'use client';

import { useEffect, useState } from 'react';
import BookingCard from '@/components/BookingCard';
import { type Booking, type Provider } from '@/types';

type TabType = 'pending' | 'active' | 'history';

export default function ProviderPage() {
    const [provider, setProvider] = useState<Provider | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const providerId = sessionStorage.getItem('currentProviderId');
        if (!providerId) {
            window.location.href = '/';
            return;
        }

        fetchProviderData(providerId);
    }, []);

    const fetchProviderData = async (providerId: string) => {
        try {
            // Fetch provider details
            const providersRes = await fetch('/api/providers');
            const providersData = await providersRes.json();

            if (providersData.success) {
                const currentProvider = providersData.data.find((p: Provider) => p.id === providerId);
                if (currentProvider) {
                    setProvider(currentProvider);

                    // Fetch their bookings
                    const bookingsRes = await fetch(`/api/bookings?provider_id=${providerId}`);
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

    const handleAction = async (action: string, bookingId: string) => {
        if (!provider) return;
        setActionLoading(true);

        try {
            let status = '';
            switch (action) {
                case 'accept':
                    status = 'accepted';
                    break;
                case 'reject':
                    status = 'rejected';
                    break;
                case 'start':
                    status = 'in_progress';
                    break;
                case 'complete':
                    status = 'completed';
                    break;
                case 'no_show':
                    status = 'no_show';
                    break;
                default:
                    return;
            }

            await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    actor_type: 'provider',
                    actor_id: provider.id,
                }),
            });

            fetchProviderData(provider.id);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAvailabilityToggle = async () => {
        if (!provider) return;

        try {
            await fetch('/api/providers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_id: provider.id,
                    is_available: !provider.is_available,
                }),
            });

            setProvider({ ...provider, is_available: !provider.is_available });
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('currentProviderId');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!provider) {
        return null;
    }

    const pendingBookings = bookings.filter(b => ['assigned'].includes(b.status));
    const activeBookings = bookings.filter(b => ['accepted', 'in_progress'].includes(b.status));
    const historyBookings = bookings.filter(b =>
        ['completed', 'cancelled', 'rejected', 'no_show', 'failed'].includes(b.status)
    );

    const getFilteredBookings = () => {
        switch (activeTab) {
            case 'pending':
                return pendingBookings;
            case 'active':
                return activeBookings;
            case 'history':
                return historyBookings;
            default:
                return [];
        }
    };

    const filteredBookings = getFilteredBookings();

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Provider Dashboard</h1>
                    <p className="page-subtitle">Manage your service requests</p>
                </div>
                <div className="flex gap-md items-center">
                    <button
                        className={`btn ${provider.is_available ? 'btn-success' : 'btn-secondary'}`}
                        onClick={handleAvailabilityToggle}
                    >
                        {provider.is_available ? '🟢 Available' : '🔴 Unavailable'}
                    </button>
                </div>
            </header>

            <div className="page-content">
                {/* Provider Info Card */}
                <div className="card mb-lg">
                    <div className="flex items-center gap-lg">
                        <div className="user-avatar-lg">🔧</div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{provider.name}</h3>
                            <p className="text-secondary">{provider.service_type.replace('_', ' ').toUpperCase()} Services</p>
                            <p className="text-secondary">{provider.phone}</p>
                        </div>
                        <div className="provider-stats">
                            <div className="stat-mini">
                                <div className="stat-mini-value">{pendingBookings.length}</div>
                                <div className="stat-mini-label">Pending</div>
                            </div>
                            <div className="stat-mini">
                                <div className="stat-mini-value">{activeBookings.length}</div>
                                <div className="stat-mini-label">Active</div>
                            </div>
                            <div className="stat-mini">
                                <div className="stat-mini-value">{historyBookings.filter(b => b.status === 'completed').length}</div>
                                <div className="stat-mini-label">Completed</div>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                            Switch Account
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        📋 Pending ({pendingBookings.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        ⚡ Active ({activeBookings.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        📊 History ({historyBookings.length})
                    </button>
                </div>

                {/* Bookings */}
                {filteredBookings.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                {activeTab === 'pending' ? '📋' : activeTab === 'active' ? '⚡' : '📊'}
                            </div>
                            <div className="empty-state-title">
                                {activeTab === 'pending' ? 'No Pending Requests' :
                                    activeTab === 'active' ? 'No Active Jobs' : 'No History Yet'}
                            </div>
                            <div className="empty-state-text">
                                {activeTab === 'pending' ? 'New service requests will appear here.' :
                                    activeTab === 'active' ? 'Jobs you\'re working on will appear here.' :
                                        'Completed jobs will appear here.'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {filteredBookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                actorType="provider"
                                onAction={handleAction}
                                showActions={!actionLoading && activeTab !== 'history'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
