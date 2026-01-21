import { STATUS_CONFIG, type BookingStatus } from '@/types';

interface StatusBadgeProps {
    status: BookingStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <span
            className={`status-badge status-${status}`}
            style={{
                background: config.bgColor,
                color: config.color
            }}
        >
            {config.label}
        </span>
    );
}
