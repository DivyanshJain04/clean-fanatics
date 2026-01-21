'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const SERVICES = [
    { icon: '🧹', name: 'Home Cleaning', color: '#FF6B6B' },
    { icon: '🔧', name: 'Plumbing', color: '#4ECDC4' },
    { icon: '⚡', name: 'Electrical', color: '#FFE66D' },
    { icon: '🔨', name: 'Carpentry', color: '#95E1D3' },
    { icon: '🎨', name: 'Painting', color: '#DDA0DD' },
    { icon: '🌿', name: 'Gardening', color: '#98D8AA' },
];

export default function HomePage() {
    const [showCustomerLogin, setShowCustomerLogin] = useState(false);
    const [showProviderLogin, setShowProviderLogin] = useState(false);
    const [showProviderRegister, setShowProviderRegister] = useState(false);

    // Login form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Registration form states
    const [regName, setRegName] = useState('');
    const [regCompany, setRegCompany] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regService, setRegService] = useState('Home Cleaning');

    // Customer Registration form states
    const [showCustomerRegister, setShowCustomerRegister] = useState(false);
    const [custRegName, setCustRegName] = useState('');
    const [custRegEmail, setCustRegEmail] = useState('');
    const [custRegPhone, setCustRegPhone] = useState('');

    const handleCustomerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== '1234') {
            setError('Invalid password.');
            setLoading(false);
            return;
        }

        try {
            // Validate credentials against backend
            const response = await fetch(`/api/customers?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                // For demo: accept any password (in production, verify against hashed password)
                const customer = data.data.find((c: { email: string }) =>
                    c.email.toLowerCase() === email.toLowerCase()
                );

                if (customer) {
                    sessionStorage.setItem('currentCustomerId', customer.id);
                    sessionStorage.setItem('currentCustomerName', customer.name);
                    window.location.href = '/customer';
                } else {
                    setError('Invalid email address. Please try again.');
                }
            } else {
                setError('No account found with this email.');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProviderLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== '1234') {
            setError('Invalid password.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/providers?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                const provider = data.data.find((p: { email: string }) =>
                    p.email.toLowerCase() === email.toLowerCase()
                );

                if (provider) {
                    sessionStorage.setItem('currentProviderId', provider.id);
                    sessionStorage.setItem('currentProviderName', provider.name);
                    window.location.href = '/provider';
                } else {
                    setError('Invalid email address. Please try again.');
                }
            } else {
                setError('No provider account found with this email.');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProviderRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: regCompany, // Use company name as the main display name
                    email: regEmail,
                    phone: regPhone,
                    service_type: regService,
                }),
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('currentProviderId', data.data.id);
                sessionStorage.setItem('currentProviderName', data.data.name);
                window.location.href = '/provider';
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: custRegName,
                    email: custRegEmail,
                    phone: custRegPhone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('currentCustomerId', data.data.id);
                sessionStorage.setItem('currentCustomerName', data.data.name);
                window.location.href = '/customer';
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowCustomerLogin(false);
        setShowProviderLogin(false);
        setShowProviderRegister(false);
        setEmail('');
        setPassword('');
        setError('');
        // Reset reg form
        setRegName('');
        setRegCompany('');
        setRegEmail('');
        setRegPhone('');
        setRegService('Home Cleaning');
        // Reset customer reg form
        setCustRegName('');
        setCustRegEmail('');
        setCustRegPhone('');
    };

    const openRegister = () => {
        closeModal();
        setShowProviderRegister(true);
    };

    const openCustomerRegister = () => {
        closeModal();
        setShowCustomerRegister(true);
    };

    return (
        <div className="hero-page">


            {/* Animated Background */}
            <div className="hero-bg">
                <div className="hero-gradient"></div>
                <div className="hero-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                    <div className="shape shape-5"></div>
                </div>
            </div>

            {/* Main Content - Split Layout */}
            <div className="hero-container">
                {/* Left Side - Branding & Services */}
                <div className="hero-left">
                    <div className="hero-brand">
                        <div className="hero-logo">
                            <span className="hero-logo-icon">✨</span>
                            <h1>Clean<span>Fanatics</span></h1>
                        </div>
                        <p className="hero-tagline">Home Services Made Easy</p>
                    </div>

                    {/* Services Grid */}
                    <div className="services-showcase">
                        <h3 className="services-label">Our Services</h3>
                        <div className="services-grid">
                            {SERVICES.map((service, index) => (
                                <div
                                    key={service.name}
                                    className="service-pill"
                                    style={{
                                        animationDelay: `${index * 0.1}s`,
                                        '--pill-color': service.color
                                    } as React.CSSProperties}
                                >
                                    <span className="service-emoji">{service.icon}</span>
                                    <span className="service-name">{service.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="hero-stats">
                        <span className="stat"><strong>500+</strong> Professionals</span>
                        <span className="stat-divider">•</span>
                        <span className="stat"><strong>10K+</strong> Happy Customers</span>
                        <span className="stat-divider">•</span>
                        <span className="stat"><strong>4.9★</strong> Rating</span>
                    </p>
                </div>

                {/* Right Side - Login Options */}
                <div className="hero-right">
                    <div className="login-panel">
                        <h2 className="login-heading">Get Started</h2>
                        <p className="login-subheading">Choose how you want to continue</p>

                        <div className="login-options">
                            {/* Customer Button */}
                            <button
                                className="login-option login-option-customer"
                                onClick={() => setShowCustomerLogin(true)}
                            >
                                <div className="option-icon">👤</div>
                                <div className="option-content">
                                    <span className="option-title">I'm a Customer</span>
                                    <span className="option-desc">Book services for your home</span>
                                </div>
                                <span className="option-arrow">→</span>
                            </button>

                            {/* Provider Button */}
                            <button
                                className="login-option login-option-provider"
                                onClick={() => setShowProviderLogin(true)}
                            >
                                <div className="option-icon">🔧</div>
                                <div className="option-content">
                                    <span className="option-title">I'm a Provider</span>
                                    <span className="option-desc">Manage your job requests</span>
                                </div>
                                <span className="option-arrow">→</span>
                            </button>
                        </div>

                        <p className="login-footer-text">
                            Trusted by thousands of homes across the city.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999 }}>
                <Link href="/admin" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    backgroundColor: '#92400e',
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease'
                }}>
                    <span>⚙️</span> <span>Admin Panel</span>
                </Link>
            </div>

            {/* Customer Login Modal */}
            {showCustomerLogin && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-login" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Customer Login</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCustomerLogin} className="login-form">
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="login-error">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>

                                <div className="login-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                                    <span className="text-secondary">New Customer?</span>
                                    <button
                                        type="button"
                                        onClick={openCustomerRegister}
                                        className="text-primary font-medium hover:underline ml-1"
                                    >
                                        Register
                                    </button>
                                </div>

                                <div className="mt-4"></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Registration Modal */}
            {showCustomerRegister && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-login" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">New Customer Registration</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCustomerRegister} className="login-form">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        value={custRegName}
                                        onChange={(e) => setCustRegName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={custRegEmail}
                                        onChange={(e) => setCustRegEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Enter your phone number"
                                        value={custRegPhone}
                                        onChange={(e) => setCustRegPhone(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="login-error">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>

                                <div className="login-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                                    <span className="text-secondary">Already have an account?</span>
                                    <button
                                        type="button"
                                        onClick={() => { closeModal(); setShowCustomerLogin(true); }}
                                        className="text-primary font-medium hover:underline ml-1"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Provider Login Modal */}
            {showProviderLogin && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-login" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Provider Login</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleProviderLogin} className="login-form">
                                <div className="form-group">
                                    <label className="form-label">Business Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your business email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="login-error">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>

                                <div className="login-links" style={{ justifyContent: 'center' }}>
                                    <span className="text-secondary">New Provider?</span>
                                    <button
                                        type="button"
                                        onClick={openRegister}
                                        className="text-primary font-medium hover:underline"
                                    >
                                        Register Business
                                    </button>
                                </div>

                                <div className="mt-4"></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Provider Registration Modal */}
            {showProviderRegister && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-login" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Provider Registration</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleProviderRegister} className="login-form">
                                <div className="form-group">
                                    <label className="form-label">Contact Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Your Name"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Business Name"
                                        value={regCompany}
                                        onChange={(e) => setRegCompany(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Business Email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Phone Number"
                                        value={regPhone}
                                        onChange={(e) => setRegPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Service Type</label>
                                    <select
                                        className="form-select"
                                        value={regService}
                                        onChange={(e) => setRegService(e.target.value)}
                                    >
                                        {SERVICES.map(s => (
                                            <option key={s.name} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {error && (
                                    <div className="login-error">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Register Business'}
                                </button>
                                <div className="login-links" style={{ justifyContent: 'center' }}>
                                    <span className="text-secondary">Already have an account?</span>
                                    <button
                                        type="button"
                                        onClick={() => { closeModal(); setShowProviderLogin(true); }}
                                        className="text-primary font-medium hover:underline"
                                    >
                                        Log In
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
