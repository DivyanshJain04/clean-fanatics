import type { BookingEvent } from '@/types';

interface EventLogProps {
    events: (BookingEvent & { customer_name?: string; provider_name?: string; service_type?: string })[];
    showBookingInfo?: boolean;
}

const EVENT_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
    booking_created: { icon: '➕', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    provider_assigned: { icon: '👤', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
    provider_accepted: { icon: '✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    provider_rejected: { icon: '✕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    status_changed: { icon: '↻', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    booking_cancelled: { icon: '⊘', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
    no_show_reported: { icon: '⚠', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    retry_triggered: { icon: '↺', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    manual_override: { icon: '⚡', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    assignment_failed: { icon: '!', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
};

const EVENT_LABELS: Record<string, string> = {
    booking_created: 'Booking Created',
    provider_assigned: 'Provider Assigned',
    provider_accepted: 'Provider Accepted',
    provider_rejected: 'Provider Rejected',
    status_changed: 'Status Changed',
    booking_cancelled: 'Booking Cancelled',
    no_show_reported: 'No-Show Reported',
    retry_triggered: 'Retry Triggered',
    manual_override: 'Manual Override',
    assignment_failed: 'Assignment Failed',
};

export default function EventLog({ events, showBookingInfo = false }: EventLogProps) {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatActorType = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    if (events.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No Events Yet</div>
                <div className="empty-state-text">Events will appear here as actions are taken.</div>
            </div>
        );
    }

    return (
        <div className="event-log">
            {events.map((event) => {
                const config = EVENT_ICONS[event.event_type] || EVENT_ICONS.status_changed;

                return (
                    <div key={event.id} className="event-item">
                        <div
                            className="event-icon"
                            style={{ background: config.bg, color: config.color }}
                        >
                            {config.icon}
                        </div>
                        <div className="event-content">
                            <div className="event-title">
                                {EVENT_LABELS[event.event_type] || event.event_type}
                                {event.old_status && event.new_status && (
                                    <span className="text-secondary" style={{ marginLeft: '8px', fontWeight: 400 }}>
                                        {event.old_status} → {event.new_status}
                                    </span>
                                )}
                            </div>
                            <div className="event-meta">
                                <span className="event-time">{formatTime(event.created_at)}</span>
                                <span>by {formatActorType(event.actor_type)}</span>
                                {showBookingInfo && event.customer_name && (
                                    <span>• {event.customer_name}</span>
                                )}
                            </div>
                            {event.metadata && (
                                <div className="font-mono text-secondary" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                    {event.metadata}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
