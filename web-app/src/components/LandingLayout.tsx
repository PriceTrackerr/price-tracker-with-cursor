import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Menu, X, LayoutGrid } from 'lucide-react';

export function LandingNav() {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
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
                        <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
                        <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">About</Link>
                        <Link to="/#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</Link>
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
                            <Link to="/features" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
                            <Link to="/about" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>About</Link>
                            <Link to="/#pricing" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                            <Link to="/contact" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Contact</Link>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <Link to="/auth" className="block w-full text-center py-2.5 text-slate-600 font-medium">
                                    Login
                                </Link>
                                <Link to="/auth" className="block w-full bg-indigo-600 text-white text-center py-2.5 rounded-lg font-medium">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export function LandingFooter() {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                                <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="75" cy="30" r="6" fill="white" />
                                </svg>
                            </div>
                            <span className="font-bold text-slate-900">Price Tracker</span>
                        </Link>
                        <p className="text-slate-500 text-sm">
                            Smart shopping tools for the modern era. Save money automatically.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/features" className="hover:text-indigo-600">Features</Link></li>
                            <li><Link to="/#pricing" className="hover:text-indigo-600">Pricing</Link></li>
                            <li><Link to="/auth" className="hover:text-indigo-600">Login</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/about" className="hover:text-indigo-600">About</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-indigo-600">Privacy</Link></li>
                            <li><Link to="/terms-and-conditions" className="hover:text-indigo-600">Terms</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Connect</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><a href="#" className="hover:text-indigo-600">Twitter</a></li>
                            <li><a href="#" className="hover:text-indigo-600">GitHub</a></li>
                            <li><Link to="/contact" className="hover:text-indigo-600">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-8 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} Price Tracker. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
