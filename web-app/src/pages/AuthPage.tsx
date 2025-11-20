import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { 
  TrendingDown, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Apple,
  Shield,
  Zap,
  Globe,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabaseClient } from '../lib/supabaseClient';

interface AuthPageProps {
  onLogin?: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = getSupabaseClient();
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session?.access_token && !token) {
          try {
            await bootstrapSession(session.access_token, session.refresh_token);
            toast.success('Signed in successfully!');
            navigate('/dashboard');
          } catch (error) {
            console.error('Failed to bootstrap session from Supabase OAuth:', error);
            toast.error('Unable to complete sign in. Please try again.');
          }
        }
      });
      subscription = data?.subscription;
    } catch (error) {
      console.warn('Supabase client unavailable for OAuth handling:', error);
    }
    return () => {
      subscription?.unsubscribe();
    };
  }, [bootstrapSession, navigate, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const success = await login(email, password);
        if (success) {
          toast.success('Login successful!');
          navigate('/dashboard');
        } else {
          toast.error('Login failed. Please check your credentials.');
        }
      } else {
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
        } else {
          toast.error('Signup failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
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
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
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
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error('Unable to start social login. Please try again.');
    } finally {
      setOauthLoading(null);
    }
  };

  const features = [
    { icon: Globe, text: "Track prices across 5+ platforms" },
    { icon: Zap, text: "Real-time price drop alerts" },
    { icon: Shield, text: "Secure & private tracking" },
    { icon: TrendingDown, text: "Browser extension included" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
      <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute bottom-32 left-32 w-5 h-5 bg-pink-400 rounded-full animate-bounce animation-delay-2000"></div>
      <div className="absolute bottom-20 right-20 w-4 h-4 bg-cyan-400 rounded-full animate-bounce animation-delay-3000"></div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Price Tracker
              </h1>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Never Miss a <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Deal</span> Again
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Track prices across Amazon, eBay, Walmart, AliExpress, and Shein. Get instant alerts when prices drop.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-emerald-700 font-medium">Trusted by 10,000+ users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="border-0 bg-white/70 backdrop-blur-xl shadow-2xl shadow-black/10 rounded-2xl overflow-hidden">
              <div className="p-8">
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Price Tracker
                    </h1>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isForgotMode ? "Reset your password" : isLogin ? "Welcome back" : "Create account"}
                  </h2>
                  <p className="text-gray-600">
                    {isForgotMode
                      ? "We'll email you a secure link to choose a new password."
                      : isLogin
                        ? "Sign in to your account"
                        : "Start tracking prices today"}
                  </p>
                </div>

                {/* Social Login */}
                <div className="space-y-3 mb-6">
                  <button 
                    className="w-full h-12 border border-gray-200 hover:bg-gray-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-3 text-gray-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={!!oauthLoading}
                  >
                    {oauthLoading === 'google' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        Connecting to Google...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>
                  
                  <button 
                    className="w-full h-12 border border-gray-200 hover:bg-gray-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-3 text-gray-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={!!oauthLoading}
                  >
                    {oauthLoading === 'apple' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        Connecting to Apple...
                      </>
                    ) : (
                      <>
                        <Apple className="w-5 h-5" />
                        Continue with Apple
                      </>
                    )}
                  </button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Form */}
                {isForgotMode ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="forgotEmail" className="text-sm font-medium text-gray-700">Account email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="forgotEmail"
                          type="email"
                          placeholder="you@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      You'll receive an email with instructions to securely reset your password.
                    </p>
                    <button 
                      type="submit" 
                      disabled={forgotLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all duration-200 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Send reset link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsForgotMode(false)}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Back to sign in
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              id="firstName"
                              type="text"
                              placeholder="John"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                              required={!isLogin}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              id="lastName"
                              type="text"
                              placeholder="Doe"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                              required={!isLogin}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {!isLogin && (
                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-10 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                            required={!isLogin}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Checkboxes */}
                    <div className="space-y-3">
                      {isLogin && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="remember" className="text-sm text-gray-600">
                            Remember me for 30 days
                          </label>
                        </div>
                      )}

                      {!isLogin && (
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                            required={!isLogin}
                          />
                          <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                            I agree to the{" "}
                            <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-700 underline">
                              Terms &amp; Conditions
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                              Privacy Policy
                            </Link>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      disabled={isLoading || (!isLogin && !acceptTerms)}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all duration-200 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          {isLogin ? "Sign In" : "Create Account"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Forgot Password */}
                    {isLogin && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotMode(true);
                            setForgotEmail(email);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* Switch between Login/Signup */}
                {!isForgotMode && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(false);
                          setIsLogin(!isLogin);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        {isLogin ? "Sign up" : "Sign in"}
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                By continuing, you agree to our{" "}
                <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-700 underline">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 