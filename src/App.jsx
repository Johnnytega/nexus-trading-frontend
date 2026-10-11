import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Layers, 
  ShieldCheck, 
  Activity,
  LogOut
} from 'lucide-react';
import Login from './Login';

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  // 1. Session State
  const [token, setToken] = useState(localStorage.getItem('nexus_token') || null);
  const [userId, setUserId] = useState(localStorage.getItem('nexus_user') || null);

  // 2. Trading State
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("AAPL");
  const [isCrypto, setIsCrypto] = useState(false);
  const [price, setPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tradeStatus, setTradeStatus] = useState(null);
  
  const chartContainerRef = useRef();
  const seriesRef = useRef(null);
  const chartRef = useRef(null);

  // Authentication Handlers
  const handleAuthSuccess = (user, jwt) => {
    localStorage.setItem('nexus_user', user);
    localStorage.setItem('nexus_token', jwt);
    setUserId(user);
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    setUserId(null);
    setToken(null);
  };

  // 3. Authenticated Data Fetching
  const fetchState = async () => {
    if (!token || !userId) return; // Safety guard prevents fetching before login
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [walletRes, portfolioRes] = await Promise.all([
        fetch(`${API_BASE}/api/wallet/${userId}`, { headers }),
        fetch(`${API_BASE}/api/portfolio/${userId}`, { headers })
      ]);
      
      if (walletRes.status === 401 || portfolioRes.status === 401) return handleLogout();
      
      setBalance((await walletRes.json()).balance);
      setHoldings((await portfolioRes.json()).holdings || []);
    } catch (err) {
      console.error("State sync failed", err);
    }
  };

  const fetchPrice = async (symbol, crypto) => {
    try {
      const res = await fetch(`${API_BASE}/api/price/${symbol}?is_crypto=${crypto}`);
      const data = await res.json();
      setPrice(data.price);
      
      if (seriesRef.current) {
        seriesRef.current.update({
          time: Math.floor(Date.now() / 1000),
          value: data.price,
        });
      }
    } catch (err) {
      console.error("Price sync failed", err);
    }
  };

  useEffect(() => { fetchState(); }, [userId]);

  // 4. Chart Initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1b2333' }, horzLines: { color: '#1b2333' } },
      width: chartContainerRef.current.clientWidth,
      height: 320,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const newSeries = chart.addSeries(AreaSeries, {
      lineColor: '#00F59B',
      topColor: 'rgba(0, 245, 155, 0.4)',
      bottomColor: 'rgba(0, 245, 155, 0.0)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = newSeries;

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedAsset]);

  // 5. Price Polling Loop
  useEffect(() => {
    fetchPrice(selectedAsset, isCrypto);
    const interval = setInterval(() => fetchPrice(selectedAsset, isCrypto), 4000);
    return () => clearInterval(interval);
  }, [selectedAsset, isCrypto]);

  // 6. Secure Execution Engine
  const handleTrade = async (side) => {
    setLoading(true);
    setTradeStatus(null);
    try {
      const endpoint = side === 'BUY' ? '/api/trade/buy' : '/api/trade/sell';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, asset_symbol: selectedAsset, quantity: parseFloat(quantity), is_crypto: isCrypto })
      });

      if (res.status === 401) return handleLogout();

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Trade failed");

      setTradeStatus({ type: 'success', message: data.message });
      await fetchState();
    } catch (err) {
      setTradeStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 7. Gateway Intercept (Must remain below all React Hooks)
  if (!token || !userId) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-obsidian-700/60 bg-obsidian-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-trade-buy">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg">NEXUS</span>
            <span className="text-xs px-2 py-0.5 ml-2 rounded bg-obsidian-700 text-slate-400 font-mono">{userId.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-obsidian-950 border border-obsidian-700/80 px-4 py-1.5 rounded-lg shadow-inner">
            <Wallet className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Purchasing Power:</span>
            <span className="font-mono font-bold text-trade-buy tracking-tight">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1400px] mx-auto w-full">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-obsidian-900/40 border border-obsidian-700/60 rounded-xl p-1 backdrop-blur-sm">
            <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-obsidian-800">
              <div className="flex items-center gap-2 bg-obsidian-950 p-1 rounded-lg border border-obsidian-800 flex-wrap">
                {[
                  { sym: 'AAPL', crypto: false },
                  { sym: 'TSLA', crypto: false },
                  { sym: 'NVDA', crypto: false },
                  { sym: 'BTC', crypto: true },
                  { sym: 'ETH', crypto: true },
                  { sym: 'SOL', crypto: true },
                ].map((item) => (
                  <button
                    key={item.sym}
                    onClick={() => { setSelectedAsset(item.sym); setIsCrypto(item.crypto); setPrice(null); }}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      selectedAsset === item.sym 
                        ? 'bg-obsidian-700 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-obsidian-800/50'
                    }`}
                  >
                    {item.sym}
                  </button>
                ))}
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-1">Live Market Data</div>
                <div className="text-3xl font-bold font-mono text-white tracking-tighter">
                  {price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '---.--'}
                </div>
              </div>
            </div>

            <div className="p-4">
              <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden border border-obsidian-800/50 bg-obsidian-950 shadow-inner"></div>
            </div>
          </div>

          <div className="bg-obsidian-900/40 border border-obsidian-700/60 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-trade-buy" /> Open Positions
              </h2>
            </div>

            {holdings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-obsidian-700 rounded-lg bg-obsidian-950/50 text-slate-500 font-mono text-sm">
                No active positions. Execute a trade to begin.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-obsidian-800">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-obsidian-950">
                    <tr className="text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Asset</th>
                      <th className="p-4 font-medium">Quantity</th>
                      <th className="p-4 font-medium">Avg Entry</th>
                      <th className="p-4 font-medium text-right">Est. Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-obsidian-800 bg-obsidian-900/20">
                    {holdings.map((h) => {
                      const currentVal = Number(h.quantity) * (selectedAsset === h.symbol && price ? price : Number(h.avg_price));
                      return (
                        <tr key={h.symbol} className="hover:bg-obsidian-800/40 transition-colors">
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500/50"></div>
                            {h.symbol}
                          </td>
                          <td className="p-4 text-slate-300">{Number(h.quantity).toFixed(4)}</td>
                          <td className="p-4 text-slate-400">${Number(h.avg_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-white font-semibold text-right">${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-obsidian-900/60 border border-obsidian-700/70 rounded-xl p-1 backdrop-blur-md sticky top-24 shadow-2xl">
            <div className="p-5 border-b border-obsidian-800 bg-obsidian-950 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center justify-between">
                Order Execution
                <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-trade-buy border border-emerald-500/20">MARKET</span>
              </h3>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-xs text-slate-500 block mb-2 font-bold uppercase tracking-wider">Order Size</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-obsidian-950 border border-obsidian-700 focus:border-trade-buy focus:ring-1 focus:ring-trade-buy px-4 py-3 rounded-lg text-white font-mono text-lg outline-none transition-all"
                  />
                  <div className="absolute right-4 top-3 text-slate-600 font-bold font-mono">
                    {selectedAsset}
                  </div>
                </div>
              </div>

              <div className="bg-obsidian-950 border border-obsidian-800 p-4 rounded-lg space-y-2 font-mono text-sm shadow-inner">
                <div className="flex justify-between text-slate-400">
                  <span>Market Price:</span>
                  <span className="text-slate-200">${price ? price.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-obsidian-800/50 pt-2 mt-2">
                  <span>Total Cost/Yield:</span>
                  <span className="text-white font-bold text-base">${price ? (price * quantity).toFixed(2) : '0.00'}</span>
                </div>
              </div>

              {tradeStatus && (
                <div className={`p-3 rounded-lg text-xs font-mono font-bold border ${
                  tradeStatus.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-trade-buy' 
                    : 'bg-rose-500/10 border-rose-500/30 text-trade-sell'
                }`}>
                  {tradeStatus.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={loading || !price}
                  onClick={() => handleTrade('BUY')}
                  className="w-full bg-trade-buy hover:bg-trade-buyHover text-obsidian-950 font-black py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,155,0.15)] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  <ArrowUpRight className="h-5 w-5 stroke-[3]" /> BUY
                </button>

                <button
                  disabled={loading || !price}
                  onClick={() => handleTrade('SELL')}
                  className="w-full bg-trade-sell hover:bg-trade-sellHover text-white font-black py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,59,105,0.15)] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  <ArrowDownRight className="h-5 w-5 stroke-[3]" /> SELL
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <ShieldCheck className="h-3 w-3 text-emerald-500/70" />
                <span>Neon PostgreSQL ACID Secure</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}