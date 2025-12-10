import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Menu, X, LayoutGrid, Home } from 'lucide-react';

export function PublicNavigation() {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Helper to handle anchor links - navigate to landing page first if not on it
    const handleAnchorClick = (anchor: string) => {
        setIsMenuOpen(false);
        if (isLandingPage) {
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = `/#${anchor}`;
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo - Clickable, navigates to home */}
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="100" height="100" rx="20" fill="transparent" />
                                <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="75" cy="30" r="6" fill="white" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Price Tracker</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                        <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
                        <button
                            onClick={() => handleAnchorClick('ai-analysis')}
                            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            AI Analysis
                        </button>
                        <button
                            onClick={() => handleAnchorClick('pricing')}
                            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            Pricing
                        </button>
                        <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Contact</Link>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-slate-500/20 flex items-center gap-2"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                                    Login
                                </Link>
                                <Link
                                    to="/auth"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-slate-100 bg-white absolute left-0 right-0 px-4 shadow-xl">
                        <div className="space-y-4">
                            <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>
                                <Home className="w-4 h-4" />
                                Home
                            </Link>
                            <Link to="/features" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
                            <button onClick={() => handleAnchorClick('ai-analysis')} className="block text-slate-600 hover:text-indigo-600 font-medium w-full text-left">AI Analysis</button>
                            <button onClick={() => handleAnchorClick('pricing')} className="block text-slate-600 hover:text-indigo-600 font-medium w-full text-left">Pricing</button>
                            <Link to="/contact" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Contact</Link>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                {user ? (
                                    <Link to="/dashboard" className="block w-full bg-slate-900 text-white text-center py-2.5 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth" className="block w-full text-center py-2.5 text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>
                                            Login
                                        </Link>
                                        <Link to="/auth" className="block w-full bg-indigo-600 text-white text-center py-2.5 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default PublicNavigation;
