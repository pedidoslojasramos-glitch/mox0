import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { Zap, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

interface VignetteProps {
  onComplete: () => void;
}

export default function Vignette({ onComplete }: VignetteProps) {
  const { settings } = useRamoxContext();
  const [currentStep, setCurrentStep] = useState(0); // 0: Logo, 1: Word 1, 2: Word 2, 3: Word 3, 4: All glowing, 5: Done

  const words = settings?.vignetteWords || ['Agilidade', 'Precisão', 'Controle'];
  const wordsJoin = words.join(',');
  const icons = [Zap, ShieldCheck, Cpu];

  useEffect(() => {
    // Stage 0: Brand Logo/Intro (0ms to 900ms)
    // Stage 1: Word 1 (900ms to 1500ms)
    // Stage 2: Word 2 (1500ms to 2100ms)
    // Stage 3: Word 3 (2100ms to 2700ms)
    // Stage 4: Synergy glow (2700ms to 4000ms)
    // Stage 5: Finish & onComplete (4000ms exact)
    
    const t0 = setTimeout(() => setCurrentStep(1), 900);
    const t1 = setTimeout(() => setCurrentStep(2), 1500);
    const t2 = setTimeout(() => setCurrentStep(3), 2100);
    const t3 = setTimeout(() => setCurrentStep(4), 2700);
    const t4 = setTimeout(() => {
      setCurrentStep(5);
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete, wordsJoin]);

  return (
    <div className="fixed inset-0 bg-[#020617] bg-radial-[circle_at_center,rgba(15,23,42,0.6)_0%,rgba(2,6,23,1)_100%] z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Cinematic grid lines overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 mt-[-20px]"
      />

      {/* Futuristic glow spheres */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"
      />
      
      {/* Top Banner Skip Button */}
      <div className="absolute top-6 right-6 z-[100] flex items-center">
        <button 
          onClick={onComplete}
          className="bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-md text-slate-400 hover:text-white rounded-full text-xs font-black tracking-[0.15em] hover:scale-105 uppercase transition-all duration-300 py-1.5 px-4 h-9 flex items-center gap-1.5 group cursor-pointer"
        >
          Pular Introdução
          <ArrowRight size={13} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>
      </div>

      <div className="relative flex flex-col items-center text-center max-w-4xl px-6 w-full gap-12">
        
        {/* Step Brand Logo and Text Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 shrink-0"
        >
          {settings?.companyLogo ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, type: "spring", stiffness: 60 }}
              className="w-24 h-24 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex items-center justify-center overflow-hidden mb-2"
            >
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, type: "spring", stiffness: 60 }}
              className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-[0_0_35px_rgba(6,182,212,0.5)] mb-2 uppercase select-none"
            >
              M
            </motion.div>
          )}

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.25em] ml-[0.25em] drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] select-none">
              MOX
            </h1>
            <p className="text-[10px] md:text-sm text-cyan-400/80 font-black uppercase tracking-[0.4em] ml-[0.4em] select-none">
              Sistemas de Almoxarifado
            </p>
          </div>
        </motion.div>

        {/* Divider lines drawing */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
          className="h-[1px] max-w-lg bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
        />

        {/* Efficiency words list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 w-full max-w-3xl">
          {words.map((word, index) => {
            const IconComponent = icons[index % icons.length];
            const isVisible = currentStep > index;

            return (
              <div key={index} className="flex flex-col items-center justify-center min-h-[100px]">
                <AnimatePresence>
                  {isVisible && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, y: 15 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        filter: currentStep === 4 ? 'drop-shadow(0 0 15px rgba(6,182,212,0.6))' : 'drop-shadow(0 0 0px rgba(0,0,0,0))'
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        type: "spring", 
                        damping: 15,
                        stiffness: 100,
                        duration: 0.6 
                      }}
                      className="flex flex-col items-center gap-3 select-none"
                    >
                      {/* Badge / visual element around word */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        currentStep === 4 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <IconComponent size={20} className={currentStep === 4 ? "animate-pulse" : ""} />
                      </div>

                      <span className={`text-xl md:text-2xl font-black uppercase tracking-widest transition-all duration-500 ${
                        currentStep === 4 
                          ? 'text-cyan-400 font-extrabold scale-105' 
                          : 'text-slate-300'
                      }`}>
                        {word}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Animated quote/bar at footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 select-none"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">
            Estoque em Tempo Real • Conexão Inteligente
          </p>
        </motion.div>

      </div>
    </div>
  );
}
