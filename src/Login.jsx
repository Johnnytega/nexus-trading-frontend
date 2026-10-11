import React, { useState } from 'react';
import { Activity, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');

      if (isLogin) {
        onAuthSuccess(userId, data.access_token);
      } else {
        setIsLogin(true);
        setUserId('');
        setPassword('');
        setSuccess('Vault secured. A $10,000 paper balance has been initialized. Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-6 font-sans text-slate-100">
      <div className="w-full max-w-md bg-obsidian-900/60 border border-obsidian-700/60 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-trade-buy shadow-[0_0_15px_rgba(0,245,155,0.15)]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-2xl">NEXUS</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-slate-500 block mb-2 font-bold uppercase tracking-wider">Trader ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 focus:border-trade-buy focus:ring-1 focus:ring-trade-buy px-4 py-3 rounded-lg text-white font-mono outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-2 font-bold uppercase tracking-wider">Passkey</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-700 focus:border-trade-buy focus:ring-1 focus:ring-trade-buy px-4 py-3 rounded-lg text-white font-mono outline-none transition-all"
                required
              />
              <Lock className="absolute right-4 top-3.5 h-4 w-4 text-slate-600" />
            </div>
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-trade-sell text-xs font-bold font-mono rounded-lg">{error}</div>}
          {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-trade-buy text-xs font-bold font-mono rounded-lg">{success}</div>}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-white hover:bg-slate-200 text-obsidian-950 font-black py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'INITIALIZE SESSION' : 'REGISTER VAULT')}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-obsidian-800 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="text-xs text-slate-400 hover:text-white font-bold transition-colors"
          >
            {isLogin ? "No vault? Register new terminal" : "Existing terminal? Initialize session"}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-slate-600 text-[10px] uppercase font-bold tracking-widest">
          <ShieldCheck className="h-3 w-3" />
          <span>End-to-End Encrypted Handshake</span>
        </div>
      </div>
    </div>
  );
}