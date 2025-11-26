import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { TrendingDown, Mail, Lock, User, Eye, EyeOff, ArrowRight, Apple, Shield, Zap, Globe, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabaseClient } from '../lib/supabaseClient';
export default function AuthPage({ onLogin }) {
    const navigate = useNavigate();
    const { login, signup, bootstrapSession, token } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [forgotEmail, setForgotEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(null);
    useEffect(() => {
        let subscription;
        try {
            const supabase = getSupabaseClient();
            const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session?.access_token && !token) {
                    try {
                        await bootstrapSession(session.access_token, session.refresh_token);
                        toast.success('Signed in successfully!');
                        navigate('/dashboard');
                    }
                    catch (error) {
                        console.error('Failed to bootstrap session from Supabase OAuth:', error);
                        toast.error('Unable to complete sign in. Please try again.');
                    }
                }
            });
            subscription = data?.subscription;
        }
        catch (error) {
            console.warn('Supabase client unavailable for OAuth handling:', error);
        }
        return () => {
            subscription?.unsubscribe();
        };
    }, [bootstrapSession, navigate, token]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                // Handle login
                const success = await login(email, password);
                if (success) {
                    toast.success('Login successful!');
                    navigate('/dashboard');
                }
                else {
                    toast.error('Login failed. Please check your credentials.');
                }
            }
            else {
                // Handle signup
                if (password !== confirmPassword) {
                    toast.error('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                if (!acceptTerms) {
                    toast.error('Please accept the terms and conditions');
                    setIsLoading(false);
                    return;
                }
                const success = await signup(email, password);
                if (success) {
                    toast.success('Account created successfully!');
                    navigate('/dashboard');
                }
                else {
                    toast.error('Signup failed. Please try again.');
                }
            }
        }
        catch (error) {
            console.error('Auth error:', error);
            toast.error('An error occurred. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            toast.error('Please enter your email');
            return;
        }
        setForgotLoading(true);
        try {
            const response = await fetch('/api/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Unable to send reset email');
            }
            toast.success('If an account exists, a reset link has been sent.');
            setIsForgotMode(false);
            setForgotEmail('');
        }
        catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error instanceof Error ? error.message : 'Unable to send reset email');
        }
        finally {
            setForgotLoading(false);
        }
    };
    const handleSocialLogin = async (provider) => {
        setOauthLoading(provider);
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: `${window.location.origin}/auth` },
            });
            if (error) {
                throw error;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        }
        catch (error) {
            console.error('OAuth error:', error);
            toast.error('Unable to start social login. Please try again.');
        }
        finally {
            setOauthLoading(null);
        }
    };
    const features = [
        { icon: Globe, text: "Track prices across 5+ platforms" },
        { icon: Zap, text: "Real-time price drop alerts" },
        { icon: Shield, text: "Secure & private tracking" },
        { icon: TrendingDown, text: "Browser extension included" }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" }), _jsx("div", { className: "absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" }), _jsx("div", { className: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" })] }), _jsx("div", { className: "absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-bounce" }), _jsx("div", { className: "absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-1000" }), _jsx("div", { className: "absolute bottom-32 left-32 w-5 h-5 bg-pink-400 rounded-full animate-bounce animation-delay-2000" }), _jsx("div", { className: "absolute bottom-20 right-20 w-4 h-4 bg-cyan-400 rounded-full animate-bounce animation-delay-3000" }), _jsxs("div", { className: "relative z-10 min-h-screen flex", children: [_jsx("div", { className: "hidden lg:flex lg:w-1/2 p-12 flex-col justify-center", children: _jsxs("div", { className: "max-w-lg", children: [_jsxs("div", { className: "flex items-center gap-3 mb-8", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center", children: _jsx(TrendingDown, { className: "w-7 h-7 text-white" }) }), _jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent", children: "Price Tracker" })] }), _jsxs("h2", { className: "text-4xl font-bold text-gray-900 mb-6 leading-tight", children: ["Never Miss a ", _jsx("span", { className: "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent", children: "Deal" }), " Again"] }), _jsx("p", { className: "text-xl text-gray-600 mb-8 leading-relaxed", children: "Track prices across Amazon, eBay, Walmart, AliExpress, and Shein. Get instant alerts when prices drop." }), _jsx("div", { className: "space-y-4 mb-8", children: features.map((feature, index) => (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center", children: _jsx(feature.icon, { className: "w-4 h-4 text-white" }) }), _jsx("span", { className: "text-gray-700 font-medium", children: feature.text })] }, index))) }), _jsxs("div", { className: "flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200", children: [_jsx("div", { className: "flex -space-x-2", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center", children: _jsx("span", { className: "text-white text-xs font-bold", children: String.fromCharCode(65 + i) }) }, i))) }), _jsxs("div", { children: [_jsx("div", { className: "flex items-center gap-1", children: [...Array(5)].map((_, i) => (_jsx(Star, { className: "w-4 h-4 fill-yellow-400 text-yellow-400" }, i))) }), _jsx("p", { className: "text-sm text-emerald-700 font-medium", children: "Trusted by 10,000+ users" })] })] })] }) }), _jsx("div", { className: "w-full lg:w-1/2 p-6 lg:p-12 flex items-center justify-center", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsx("div", { className: "border-0 bg-white/70 backdrop-blur-xl shadow-2xl shadow-black/10 rounded-2xl overflow-hidden", children: _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs("div", { className: "lg:hidden flex items-center justify-center gap-2 mb-4", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center", children: _jsx(TrendingDown, { className: "w-5 h-5 text-white" }) }), _jsx("h1", { className: "text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent", children: "Price Tracker" })] }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: isForgotMode ? "Reset your password" : isLogin ? "Welcome back" : "Create account" }), _jsx("p", { className: "text-gray-600", children: isForgotMode
                                                            ? "We'll email you a secure link to choose a new password."
                                                            : isLogin
                                                                ? "Sign in to your account"
                                                                : "Start tracking prices today" })] }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsx("button", { className: "w-full h-12 border border-gray-200 hover:bg-gray-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-3 text-gray-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed", type: "button", onClick: () => handleSocialLogin('google'), disabled: !!oauthLoading, children: oauthLoading === 'google' ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" }), "Connecting to Google..."] })) : (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Continue with Google"] })) }), _jsx("button", { className: "w-full h-12 border border-gray-200 hover:bg-gray-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-3 text-gray-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed", type: "button", onClick: () => handleSocialLogin('apple'), disabled: !!oauthLoading, children: oauthLoading === 'apple' ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" }), "Connecting to Apple..."] })) : (_jsxs(_Fragment, { children: [_jsx(Apple, { className: "w-5 h-5" }), "Continue with Apple"] })) })] }), _jsxs("div", { className: "relative mb-6", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-200" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: "or" }) })] }), isForgotMode ? (_jsxs("form", { onSubmit: handleForgotPassword, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "forgotEmail", className: "text-sm font-medium text-gray-700", children: "Account email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { id: "forgotEmail", type: "email", placeholder: "you@example.com", value: forgotEmail, onChange: (e) => setForgotEmail(e.target.value), className: "w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200", required: true })] })] }), _jsx("p", { className: "text-sm text-gray-500", children: "You'll receive an email with instructions to securely reset your password." }), _jsx("button", { type: "submit", disabled: forgotLoading, className: "w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all duration-200 rounded-lg font-medium flex items-center justify-center gap-2", children: forgotLoading ? (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: ["Send reset link", _jsx(ArrowRight, { className: "w-4 h-4" })] })) }), _jsx("button", { type: "button", onClick: () => setIsForgotMode(false), className: "w-full text-sm text-blue-600 hover:text-blue-700 underline", children: "Back to sign in" })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [!isLogin && (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "firstName", className: "text-sm font-medium text-gray-700", children: "First name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { id: "firstName", type: "text", placeholder: "John", value: firstName, onChange: (e) => setFirstName(e.target.value), className: "w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200", required: !isLogin })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "lastName", className: "text-sm font-medium text-gray-700", children: "Last name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { id: "lastName", type: "text", placeholder: "Doe", value: lastName, onChange: (e) => setLastName(e.target.value), className: "w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200", required: !isLogin })] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "email", className: "text-sm font-medium text-gray-700", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { id: "email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "password", className: "text-sm font-medium text-gray-700", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { id: "password", type: showPassword ? "text" : "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full pl-10 pr-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), !isLogin && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "confirmPassword", className: "text-sm font-medium text-gray-700", children: "Confirm password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "w-full pl-10 pr-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200", required: !isLogin }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showConfirmPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] })), _jsxs("div", { className: "space-y-3", children: [isLogin && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "remember", checked: rememberMe, onChange: (e) => setRememberMe(e.target.checked), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("label", { htmlFor: "remember", className: "text-sm text-gray-600", children: "Remember me for 30 days" })] })), !isLogin && (_jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("input", { type: "checkbox", id: "terms", checked: acceptTerms, onChange: (e) => setAcceptTerms(e.target.checked), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1", required: !isLogin }), _jsxs("label", { htmlFor: "terms", className: "text-sm text-gray-600 leading-relaxed", children: ["I agree to the", " ", _jsx(Link, { to: "/terms-and-conditions", className: "text-blue-600 hover:text-blue-700 underline", children: "Terms & Conditions" }), " ", "and", " ", _jsx(Link, { to: "/privacy-policy", className: "text-blue-600 hover:text-blue-700 underline", children: "Privacy Policy" })] })] }))] }), _jsx("button", { type: "submit", disabled: isLoading || (!isLogin && !acceptTerms), className: "w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all duration-200 rounded-lg font-medium flex items-center justify-center gap-2", children: isLoading ? (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [isLogin ? "Sign In" : "Create Account", _jsx(ArrowRight, { className: "w-4 h-4" })] })) }), isLogin && (_jsx("div", { className: "text-center", children: _jsx("button", { type: "button", onClick: () => {
                                                                setIsForgotMode(true);
                                                                setForgotEmail(email);
                                                            }, className: "text-sm text-blue-600 hover:text-blue-700 underline", children: "Forgot your password?" }) }))] })), !isForgotMode && (_jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-sm text-gray-600", children: [isLogin ? "Don't have an account? " : "Already have an account? ", _jsx("button", { type: "button", onClick: () => {
                                                                setIsForgotMode(false);
                                                                setIsLogin(!isLogin);
                                                            }, className: "text-blue-600 hover:text-blue-700 font-medium underline", children: isLogin ? "Sign up" : "Sign in" })] }) }))] }) }), _jsx("div", { className: "mt-8 text-center", children: _jsxs("p", { className: "text-sm text-gray-500", children: ["By continuing, you agree to our", " ", _jsx(Link, { to: "/terms-and-conditions", className: "text-blue-600 hover:text-blue-700 underline", children: "Terms & Conditions" }), " ", "and", " ", _jsx(Link, { to: "/privacy-policy", className: "text-blue-600 hover:text-blue-700 underline", children: "Privacy Policy" })] }) })] }) })] })] }));
}
//# sourceMappingURL=AuthPage.js.map