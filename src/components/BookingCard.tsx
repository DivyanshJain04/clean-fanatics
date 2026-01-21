import { SERVICE_TYPE_LABELS, type Booking, type BookingStatus } from '@/types';
import StatusBadge from './StatusBadge';

interface BookingCardProps {
    booking: Booking;
    onAction?: (action: string, bookingId: string) => void;
    showActions?: boolean;
    actorType?: 'customer' | 'provider' | 'admin';
}

const SERVICE_ICONS: Record<string, string> = {
    cleaning: '🧹',
    plumbing: '🔧',
    electrical: '⚡',
    carpentry: '🪚',
    painting: '🎨',
    gardening: '🌱',
    appliance_repair: '🔌',
};

export default function BookingCard({ booking, onAction, showActions = true, actorType = 'customer' }: BookingCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getAvailableActions = (): { label: string; action: string; variant: string }[] => {
        const status = booking.status as BookingStatus;

        if (actorType === 'customer') {
            if (['pending', 'assigned', 'accepted'].includes(status)) {
                return [{ label: 'Cancel Booking', action: 'cancel', variant: 'danger' }];
            }
        }

        if (actorType === 'provider') {
            switch (status) {
                case 'assigned':
                    return [
                        { label: 'Accept', action: 'accept', variant: 'success' },
                        { label: 'Reject', action: 'reject', variant: 'danger' },
                    ];
                case 'accepted':
                    return [
                        { label: 'Start Service', action: 'start', variant: 'primary' },
                        { label: 'No Show', action: 'no_show', variant: 'secondary' },
                    ];
                case 'in_progress':
                    return [{ label: 'Complete', action: 'complete', variant: 'success' }];
            }
        }

        if (actorType === 'admin') {
            const actions: { label: string; action: string; variant: string }[] = [];

            if (!booking.provider_id && status !== 'completed' && status !== 'cancelled') {
                actions.push({ label: 'Assign Provider', action: 'assign', variant: 'primary' });
            }

            if (!['completed', 'cancelled'].includes(status)) {
                actions.push({ label: 'Override Status', action: 'override', variant: 'secondary' });
                actions.push({ label: 'Cancel', action: 'cancel', variant: 'danger' });
            }

            return actions;
        }

        return [];
    };

    const actions = showActions ? getAvailableActions() : [];

    return (
        <div className="card booking-card">
            <div className="booking-header">
                <div className="booking-service">
                    <div className="booking-service-icon">
                        {SERVICE_ICONS[booking.service_type] || '🏠'}
                    </div>
                    <div>
                        <div className="booking-service-name">
                            {SERVICE_TYPE_LABELS[booking.service_type as keyof typeof SERVICE_TYPE_LABELS] || booking.service_type}
                        </div>
                        <div className="booking-id">#{booking.id.slice(0, 8)}</div>
                    </div>
                </div>
                <StatusBadge status={booking.status as BookingStatus} />
            </div>

            <div className="booking-details">
                <div className="booking-detail">
                    <span className="booking-detail-label">Customer</span>
                    <span className="booking-detail-value">{booking.customer_name || 'N/A'}</span>
                </div>
                <div className="booking-detail">
                    <span className="booking-detail-label">Provider</span>
                    <span className="booking-detail-value">{booking.provider_name || 'Unassigned'}</span>
                </div>
                <div className="booking-detail">
                    <span className="booking-detail-label">Scheduled</span>
                    <span className="booking-detail-value">{formatDate(booking.scheduled_at)}</span>
                </div>
                <div className="booking-detail">
                    <span className="booking-detail-label">Address</span>
                    <span className="booking-detail-value truncate" title={booking.address}>
                        {booking.address}
                    </span>
                </div>
                {booking.notes && (
                    <div className="booking-detail" style={{ gridColumn: '1 / -1' }}>
                        <span className="booking-detail-label">Notes</span>
                        <span className="booking-detail-value">{booking.notes}</span>
                    </div>
                )}
                {booking.retry_count > 0 && (
                    <div className="booking-detail">
                        <span className="booking-detail-label">Retry Count</span>
                        <span className="booking-detail-value">{booking.retry_count} / 3</span>
                    </div>
                )}
            </div>

            {actions.length > 0 && (
                <div className="booking-actions">
                    {actions.map((action) => (
                        <button
                            key={action.action}
                            className={`btn btn-${action.variant} btn-sm`}
                            onClick={() => onAction?.(action.action, booking.id)}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
