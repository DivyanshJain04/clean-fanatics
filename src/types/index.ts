// Booking Status Types
export type BookingStatus =
    | 'pending'
    | 'assigned'
    | 'accepted'
    | 'rejected'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'failed';

// Service Types
export type ServiceType =
    | 'cleaning'
    | 'plumbing'
    | 'electrical'
    | 'carpentry'
    | 'painting'
    | 'gardening'
    | 'appliance_repair';

// Actor Types for Event Logging
export type ActorType = 'customer' | 'provider' | 'system' | 'admin';

// Event Types
export type EventType =
    | 'booking_created'
    | 'provider_assigned'
    | 'provider_accepted'
    | 'provider_rejected'
    | 'status_changed'
    | 'booking_cancelled'
    | 'no_show_reported'
    | 'retry_triggered'
    | 'manual_override'
    | 'assignment_failed';

// Customer Interface
export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

// Provider Interface
export interface Provider {
    id: string;
    name: string;
    email: string;
    phone: string;
    service_type: ServiceType;
    is_available: boolean;
    created_at: string;
}

// Booking Interface
export interface Booking {
    id: string;
    customer_id: string;
    provider_id: string | null;
    service_type: ServiceType;
    status: BookingStatus;
    scheduled_at: string;
    address: string;
    notes: string | null;
    retry_count: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    provider_name?: string;
    provider_email?: string;
    provider_phone?: string;
}

// Booking Event Interface
export interface BookingEvent {
    id: string;
    booking_id: string;
    event_type: EventType;
    old_status: BookingStatus | null;
    new_status: BookingStatus | null;
    actor_type: ActorType;
    actor_id: string;
    metadata: string | null;
    created_at: string;
}

// API Request/Response Types
export interface CreateBookingRequest {
    customer_id: string;
    service_type: ServiceType;
    scheduled_at: string;
    address: string;
    notes?: string;
}

export interface UpdateBookingRequest {
    status?: BookingStatus;
    provider_id?: string;
    notes?: string;
}

export interface AssignProviderRequest {
    provider_id?: string; // If not provided, auto-assign
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Service Type Labels for UI
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
    cleaning: 'Home Cleaning',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    carpentry: 'Carpentry',
    painting: 'Painting',
    gardening: 'Gardening',
    appliance_repair: 'Appliance Repair',
};

// Status Labels and Colors for UI
export const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
    assigned: { label: 'Assigned', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.15)' },
    accepted: { label: 'Accepted', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
    rejected: { label: 'Rejected', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
    in_progress: { label: 'In Progress', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
    completed: { label: 'Completed', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    cancelled: { label: 'Cancelled', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
    no_show: { label: 'No Show', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
    failed: { label: 'Failed', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.15)' },
};
