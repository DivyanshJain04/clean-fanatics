'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const pathname = usePathname();

    // Don't show navbar on home page (login/role selection)
    if (pathname === '/') {
        return null;
    }

    const isActive = (path: string) => {
        return pathname.startsWith(path);
    };

    const getCurrentSection = () => {
        if (pathname.startsWith('/customer')) return 'customer';
        if (pathname.startsWith('/provider')) return 'provider';
        if (pathname.startsWith('/admin')) return 'admin';
        return '';
    };

    const section = getCurrentSection();

    return (
        <header className="navbar">
            <div className="navbar-container">
                <Link href="/" className="navbar-logo">
                    <div className="navbar-logo-icon">🏠</div>
                    <span className="navbar-logo-text">Clean<span>Fanatics</span></span>
                </Link>

                <nav className="navbar-nav">
                    {section === 'customer' && (
                        <>
                            <Link href="/customer" className={`navbar-link ${pathname === '/customer' ? 'active' : ''}`}>
                                My Bookings
                            </Link>
                            <Link href="/customer/book" className={`navbar-link ${pathname === '/customer/book' ? 'active' : ''}`}>
                                New Booking
                            </Link>
                        </>
                    )}
                    {section === 'provider' && (
                        <>
                            <Link href="/provider" className={`navbar-link ${pathname === '/provider' ? 'active' : ''}`}>
                                My Jobs
                            </Link>
                        </>
                    )}
                    {section === 'admin' && (
                        <>
                            <Link href="/admin" className={`navbar-link ${pathname === '/admin' ? 'active' : ''}`}>
                                All Bookings
                            </Link>
                            <Link href="/admin/events" className={`navbar-link ${pathname === '/admin/events' ? 'active' : ''}`}>
                                Event Log
                            </Link>
                        </>
                    )}
                </nav>

                <div className="navbar-actions">
                    <Link href="/" className="btn btn-secondary btn-sm">
                        ← Switch Role
                    </Link>
                </div>
            </div>
        </header>
    );
}
