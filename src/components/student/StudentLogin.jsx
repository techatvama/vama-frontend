import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    Zap,
    ArrowRight,
    Mail,
    Lock,
    Loader2,
    Music,
    AlertCircle,
    Star,
    Users
} from 'lucide-react';

export default function StudentLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/student/login', { email, password });
            localStorage.setItem('student', JSON.stringify(response.data.student));
            navigate('/student-portal');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#463a7a]/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white/5 backdrop-blur-3xl rounded-[60px] border border-white/10 shadow-2xl relative z-10 overflow-hidden">
                {/* Left Side: Illustration & Welcome */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-[#463a7a] to-[#2d2550] relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                                <Zap className="text-yellow-400 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter">OPTIMUS</span>
                        </div>
                        <h2 className="text-6xl font-black text-white leading-none tracking-tighter mb-6">
                            Awaken the<br />
                            <span className="text-indigo-300">Artist Within.</span>
                        </h2>
                        <p className="text-indigo-100/60 text-lg font-medium max-w-sm">
                            Manage your classes, fees and progress all in one place.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-6">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px]">
                            <Star className="text-yellow-400 mb-4 fill-current" />
                            <p className="text-white font-black text-xl leading-none">4.9/5</p>
                            <p className="text-indigo-200/40 text-[10px] font-bold uppercase tracking-widest mt-2">Student Rating</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px]">
                            <Users className="text-indigo-400 mb-4 fill-current" />
                            <p className="text-white font-black text-xl leading-none">1K+</p>
                            <p className="text-indigo-200/40 text-[10px] font-bold uppercase tracking-widest mt-2">Active Students</p>
                        </div>
                    </div>

                    <Music className="absolute -bottom-20 -right-20 w-96 h-96 text-white/5 rotate-12" />
                </div>

                {/* Right Side: Login Form */}
                <div className="p-8 lg:p-20 flex flex-col justify-center bg-white/5">
                    <div className="mb-12">
                        <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-4">Student Portal</h1>
                        <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Sign in with your academy credentials</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Academy Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border-2 border-white/5 rounded-[28px] py-5 pl-14 pr-6 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Secret Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border-2 border-white/5 rounded-[28px] py-5 pl-14 pr-6 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 rounded-lg bg-white/5 border-white/10 text-indigo-500 focus:ring-0 transition-all" />
                                <span className="text-xs font-bold text-white/40 group-hover:text-white transition-colors">Remember me</span>
                            </label>
                            <button type="button" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Forgot Password?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-[28px] py-6 font-black text-lg shadow-2xl shadow-indigo-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    ENTER PORTAL
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-white/20 text-xs font-bold">
                            Interested in joining Vama Academy? <button className="text-indigo-400 hover:underline">Enroll Now</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
