import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'CleanFanatics - Home Services Booking',
    description: 'On-demand home services marketplace for booking cleaning, plumbing, electrical, and more.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <Navigation />
                <main className="main-container">
                    {children}
                </main>
            </body>
        </html>
    );
}
