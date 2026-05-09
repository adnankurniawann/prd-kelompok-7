'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({ name: '', price: 0, dist: '' });
  const [budget, setBudget] = useState(20000);

  const dummyFoods = [
    { name: "Nasi Goreng AA Ciseke", price: 15000, dist: "0.2 km" },
    { name: "Ayam Geprek Pangeran", price: 18000, dist: "0.5 km" },
    { name: "Sate Padang Sayang", price: 20000, dist: "1.2 km" },
    { name: "Warteg Bahari", price: 12000, dist: "0.1 km" },
  ];

  const handleSpin = () => {
    setIsSpinning(true);
    const affordable = dummyFoods.filter(f => f.price <= budget);
    const selected = affordable[Math.floor(Math.random() * affordable.length)] || dummyFoods[0];
    
    setTimeout(() => {
      setIsSpinning(false);
      setResult(selected);
      setShowResult(true);
    }, 2000);
  };

  return (
    <main className="max-w-[400px] mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden border-x border-slate-200 shadow-xl">
      {/* HEADER */}
      <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-white">
        <div>
          <p className="text-xs text-slate-500">Selamat Pagi,</p>
          <h1 className="text-lg font-bold text-slate-900">Adnan (IF25)</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Adnan`} alt="Avatar" />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'home' && (
          <div className="p-6 space-y-6">
            {/* Wallet Card */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
              <p className="text-xs text-slate-400 mb-1">Sisa Saldo Makan</p>
              <h2 className="text-3xl font-bold mb-4">Rp 450.000</h2>
              <div className="flex gap-2 text-[10px]">
                <span className="bg-white/10 px-2 py-1 rounded-full">Hemat 15%</span>
                <span className="bg-white/10 px-2 py-1 rounded-full">Cukup s.d. akhir bulan</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('gacha')}
              className="w-full bg-rose-500 text-white rounded-xl p-4 font-bold shadow-lg shadow-rose-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              BINGUNG MAKAN APA? SPIN!
            </button>

            {/* Hygiene Alerts */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-sm italic">Radar Higienitas Jatinangor</h3>
              <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex gap-3">
                <div className="text-rose-500 mt-1">⚠️</div>
                <div>
                  <h4 className="font-bold text-xs">Warteg X, Ciseke</h4>
                  <p className="text-[11px] text-slate-500">"Banyak lalat di etalase, ada laporan sakit perut."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gacha' && (
          <div className="p-6 flex flex-col items-center h-full">
             <h2 className="text-xl font-bold mb-8">Gacha Makan</h2>
             
             {/* Filter Simple */}
             <div className="w-full bg-white p-4 rounded-xl shadow-sm mb-12">
               <label className="block text-xs font-bold mb-2">Budget Maksimal: Rp {budget.toLocaleString()}</label>
               <input 
                type="range" min="10000" max="50000" step="5000" 
                value={budget} onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full accent-rose-500"
               />
             </div>

             {/* Spin Button with Framer Motion */}
             <div className="relative mt-12">
               <motion.button
                animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                transition={isSpinning ? { repeat: Infinity, duration: 0.5, ease: "linear" } : {}}
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-40 h-40 rounded-full bg-rose-500 text-white font-black text-2xl border-4 border-white shadow-2xl z-10 relative"
               >
                 {isSpinning ? 'SPINNING' : 'SPIN!'}
               </motion.button>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-dashed border-rose-300 animate-spin" />
             </div>
          </div>
        )}
      </div>

      {/* NAVIGATION BAR */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-rose-500' : 'text-slate-400'}`}>
          <span className="text-[10px] font-bold">HOME</span>
        </button>
        <button onClick={() => setActiveTab('gacha')} className={`flex flex-col items-center ${activeTab === 'gacha' ? 'text-rose-500' : 'text-slate-400'}`}>
          <div className="bg-rose-50 p-3 rounded-full -mt-8 border-4 border-slate-50 text-rose-500">
             <span className="text-xs">SPIN</span>
          </div>
        </button>
        <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center ${activeTab === 'map' ? 'text-rose-500' : 'text-slate-400'}`}>
          <span className="text-[10px] font-bold">MAP</span>
        </button>
      </nav>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {showResult && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white w-full p-6 rounded-3xl text-center"
            >
              <h3 className="text-2xl font-bold text-slate-900">{result.name}</h3>
              <p className="text-rose-500 font-bold my-2">Rp {result.price.toLocaleString()}</p>
              <p className="text-slate-500 text-sm mb-6">📍 Jarak: {result.dist}</p>
              <button 
                onClick={() => setShowResult(false)}
                className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold"
              >
                GAS OTW!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}