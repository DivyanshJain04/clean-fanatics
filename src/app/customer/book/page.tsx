'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Customer } from '@/types';

const SERVICE_TYPES = [
    { value: 'cleaning', label: 'Home Cleaning', icon: '🧹' },
    { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
    { value: 'painting', label: 'Painting', icon: '🎨' },
    { value: 'gardening', label: 'Gardening', icon: '🌱' },
    { value: 'appliance_repair', label: 'Appliance Repair', icon: '🔌' },
];

export default function BookServicePage() {
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        service_type: 'cleaning',
        scheduled_at: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        const customerId = sessionStorage.getItem('currentCustomerId');
        if (!customerId) {
            window.location.href = '/';
            return;
        }

        fetchCustomer(customerId);

        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        setFormData(prev => ({
            ...prev,
            scheduled_at: tomorrow.toISOString().slice(0, 16),
        }));
    }, []);

    const fetchCustomer = async (customerId: string) => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            if (data.success) {
                const current = data.data.find((c: Customer) => c.id === customerId);
                if (current) {
                    setCustomer(current);
                    // Pre-fill address if available
                    if (current.address) {
                        setFormData(prev => ({ ...prev, address: current.address }));
                    }
                }
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: customer?.id,
                    service_type: formData.service_type,
                    scheduled_at: formData.scheduled_at,
                    address: formData.address,
                    notes: formData.notes,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/customer');
                }, 2000);
            } else {
                setError(data.error || 'Failed to create booking');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="page-content">
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>✅</div>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Booking Confirmed!</h2>
                    <p className="text-secondary">Your service has been scheduled. A provider will be assigned shortly.</p>
                    <p className="text-secondary mt-md">Redirecting to your bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Book a Service</h1>
                    <p className="page-subtitle">Schedule a home service appointment</p>
                </div>
            </header>

            <div className="page-content">
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {/* Customer Info */}
                    <div className="flex items-center gap-md mb-lg" style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div className="user-avatar">👤</div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{customer?.name}</div>
                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{customer?.email}</div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error mb-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Service Type Selection */}
                        <div className="form-group">
                            <label className="form-label">Select Service Type</label>
                            <div className="service-type-grid">
                                {SERVICE_TYPES.map((service) => (
                                    <button
                                        key={service.value}
                                        type="button"
                                        className={`service-type-option ${formData.service_type === service.value ? 'selected' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, service_type: service.value }))}
                                    >
                                        <span className="service-type-icon">{service.icon}</span>
                                        <span className="service-type-label">{service.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="form-group">
                            <label className="form-label">Preferred Date & Time</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={formData.scheduled_at}
                                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Address */}
                        <div className="form-group">
                            <label className="form-label">Service Address</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter complete address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label">Special Instructions (Optional)</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Any specific requirements or instructions for the service provider..."
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-md mt-lg">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => router.push('/customer')}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                                style={{ flex: 1 }}
                            >
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
