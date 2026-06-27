import React, { useState } from 'react';
import { Eye, EyeOff, Film, Lock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: (password: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onLoginSuccess(password);
      } else {
        const data = await response.json();
        setError(data.error || 'كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="admin-login-container" className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0b] via-[#0e0e11] to-[#050507] p-4 relative overflow-hidden">
      {/* Cinematic grid lines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_28px]" />
      
      {/* Soft background red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        id="login-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#0c0c0e]/90 backdrop-blur-xl border border-zinc-800/80 p-8 md:p-10 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-md shadow-red-950/20 mb-4">
            <Film className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 text-center font-sans">
            بوابة العرض السينمائي المغلقة
          </h1>
          <p className="text-zinc-400 text-xs mt-3.5 text-center font-light leading-relaxed">
            هذه المنصة مخصصة لإدارة وتوليد روابط المشاهدة الآمنة والمخفية عن العامة ومحركات البحث. يرجى إدخال كلمة المرور للوصول.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5 text-right">
              كلمة مرور الإدارة
            </label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3.5 bg-[#050507] border border-zinc-800 hover:border-zinc-700 focus:border-red-600 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none transition duration-200 text-center font-mono"
                autoFocus
              />
              <div className="absolute inset-y-0 left-3.5 flex items-center text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <button
                id="toggle-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3.5 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/30 border border-red-900/45 rounded-xl flex items-start gap-3 text-red-400 text-xs text-right"
              dir="rtl"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-red-950/30 transition duration-150 focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-zinc-200 border-t-transparent rounded-full animate-spin" />
            ) : (
              'الدخول إلى لوحة التحكم'
            )}
          </button>
        </form>
      </motion.div>

      {/* Decorative subtle copyright footer */}
      <p className="text-zinc-700 text-[10px] mt-12 relative z-10 font-mono tracking-widest uppercase">
        Private Cinema Portal • Security Active
      </p>
    </div>
  );
}
