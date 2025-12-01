import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { TrendingDown, Mail, Lock, Eye, EyeOff, ArrowRight, Apple, Shield, Zap, Globe, Star } from 'lucide-react';
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
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 relative overflow-hidden flex", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [_jsx("div", { className: "absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" }), _jsx("div", { className: "absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse animation-delay-2000" })] }), _jsx("div", { className: "hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center p-12 xl:p-24", children: _jsxs("div", { className: "max-w-xl", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-3 mb-12 group", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300", children: _jsx(TrendingDown, { className: "w-7 h-7 text-white" }) }), _jsx("span", { className: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400", children: "Price Tracker" })] }), _jsxs("h1", { className: "text-5xl font-bold text-white mb-6 leading-tight", children: ["Start saving with ", _jsx("br", {}), _jsx("span", { className: "bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400", children: "AI-powered intelligence" })] }), _jsx("p", { className: "text-lg text-slate-400 mb-12 leading-relaxed max-w-md", children: "Join thousands of smart shoppers who save an average of $340/year using our advanced tracking tools." }), _jsx("div", { className: "space-y-6", children: features.map((feature, index) => (_jsxs("div", { className: "flex items-center gap-4 group", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300", children: _jsx(feature.icon, { className: "w-5 h-5 text-indigo-400 group-hover:text-indigo-300" }) }), _jsx("span", { className: "text-slate-300 font-medium group-hover:text-white transition-colors", children: feature.text })] }, index))) }), _jsxs("div", { className: "mt-12 pt-8 border-t border-slate-800/50 flex items-center gap-6", children: [_jsx("div", { className: "flex -space-x-3", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400", children: String.fromCharCode(65 + i) }, i))) }), _jsxs("div", { children: [_jsx("div", { className: "flex items-center gap-1 mb-1", children: [...Array(5)].map((_, i) => (_jsx(Star, { className: "w-4 h-4 fill-amber-400 text-amber-400" }, i))) }), _jsxs("p", { className: "text-sm text-slate-400", children: ["Trusted by ", _jsx("span", { className: "text-white font-semibold", children: "10,000+ users" })] })] })] })] }) }), _jsx("div", { className: "w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl", children: [_jsxs("div", { className: "lg:hidden text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl mb-4", children: _jsx(TrendingDown, { className: "w-6 h-6 text-white" }) }), _jsx("h2", { className: "text-2xl font-bold text-white", children: "Price Tracker" })] }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: isForgotMode ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account" }), _jsx("p", { className: "text-slate-400", children: isForgotMode
                                            ? "Enter your email to receive reset instructions"
                                            : isLogin
                                                ? "Enter your details to access your account"
                                                : "Start your journey to smarter shopping" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-8", children: [_jsx("button", { onClick: () => handleSocialLogin('google'), disabled: !!oauthLoading, className: "flex items-center justify-center gap-2 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50", children: oauthLoading === 'google' ? (_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#fff", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), _jsx("span", { className: "text-white font-medium", children: "Google" })] })) }), _jsx("button", { onClick: () => handleSocialLogin('apple'), disabled: !!oauthLoading, className: "flex items-center justify-center gap-2 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50", children: oauthLoading === 'apple' ? (_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(Apple, { className: "w-5 h-5 text-white" }), _jsx("span", { className: "text-white font-medium", children: "Apple" })] })) })] }), _jsxs("div", { className: "relative mb-8", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-slate-700" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-4 bg-slate-900 text-slate-500", children: "Or continue with email" }) })] }), isForgotMode ? (_jsxs("form", { onSubmit: handleForgotPassword, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-300", children: "Email Address" }), _jsxs("div", { className: "relative group", children: [_jsx(Mail, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" }), _jsx("input", { type: "email", value: forgotEmail, onChange: (e) => setForgotEmail(e.target.value), className: "w-full h-12 bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all", placeholder: "name@example.com", required: true })] })] }), _jsx("button", { type: "submit", disabled: forgotLoading, className: "w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2", children: forgotLoading ? (_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: ["Send Reset Link", _jsx(ArrowRight, { className: "w-4 h-4" })] })) }), _jsx("button", { type: "button", onClick: () => setIsForgotMode(false), className: "w-full text-sm text-slate-400 hover:text-white transition-colors mt-4", children: "Back to sign in" })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [!isLogin && (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-300", children: "First Name" }), _jsx("input", { type: "text", value: firstName, onChange: (e) => setFirstName(e.target.value), className: "w-full h-12 bg-slate-800/50 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all", placeholder: "John", required: !isLogin })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-300", children: "Last Name" }), _jsx("input", { type: "text", value: lastName, onChange: (e) => setLastName(e.target.value), className: "w-full h-12 bg-slate-800/50 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all", placeholder: "Doe", required: !isLogin })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-300", children: "Email Address" }), _jsxs("div", { className: "relative group", children: [_jsx(Mail, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full h-12 bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all", placeholder: "name@example.com", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-300", children: "Password" }), _jsxs("div", { className: "relative group", children: [_jsx(Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" }), _jsx("input", { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full h-12 bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors", children: showPassword ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] })] }), !isLogin && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-300", children: "Confirm Password" }), _jsxs("div", { className: "relative group", children: [_jsx(Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" }), _jsx("input", { type: showConfirmPassword ? "text" : "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "w-full h-12 bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: !isLogin }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors", children: showConfirmPassword ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] })] })), _jsx("div", { className: "flex items-center justify-between pt-2", children: isLogin ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: rememberMe, onChange: (e) => setRememberMe(e.target.checked), className: "w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900" }), _jsx("span", { className: "text-sm text-slate-400", children: "Remember me" })] }), _jsx("button", { type: "button", onClick: () => {
                                                        setIsForgotMode(true);
                                                        setForgotEmail(email);
                                                    }, className: "text-sm text-indigo-400 hover:text-indigo-300 transition-colors", children: "Forgot password?" })] })) : (_jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: acceptTerms, onChange: (e) => setAcceptTerms(e.target.checked), className: "w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 mt-1", required: !isLogin }), _jsxs("span", { className: "text-sm text-slate-400", children: ["I agree to the ", _jsx(Link, { to: "/terms", className: "text-indigo-400 hover:text-indigo-300", children: "Terms" }), " and ", _jsx(Link, { to: "/privacy", className: "text-indigo-400 hover:text-indigo-300", children: "Privacy Policy" })] })] })) }), _jsx("button", { type: "submit", disabled: isLoading || (!isLogin && !acceptTerms), className: "w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6", children: isLoading ? (_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [isLogin ? "Sign In" : "Create Account", _jsx(ArrowRight, { className: "w-4 h-4" })] })) })] })), _jsx("div", { className: "mt-8 text-center", children: _jsxs("p", { className: "text-slate-400", children: [isLogin ? "Don't have an account? " : "Already have an account? ", _jsx("button", { onClick: () => {
                                                setIsForgotMode(false);
                                                setIsLogin(!isLogin);
                                            }, className: "text-indigo-400 hover:text-indigo-300 font-medium transition-colors", children: isLogin ? "Sign up" : "Sign in" })] }) })] }) }) })] }));
}
//# sourceMappingURL=AuthPage.js.map