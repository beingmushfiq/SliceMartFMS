import React from 'react';
import { motion } from 'framer-motion';

interface PlatformPulseLoaderProps {
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const PlatformPulseLoader: React.FC<PlatformPulseLoaderProps> = ({
  label = 'Synchronizing Platform Telemetry...',
  sublabel = 'Querying multi-tenant isolation grid & authority mesh',
  size = 'md',
  fullScreen = false,
}) => {
  const dimensions = {
    sm: { box: 'w-16 h-16', svg: 64, stroke: 2, radius: 24 },
    md: { box: 'w-24 h-24', svg: 96, stroke: 2.5, radius: 36 },
    lg: { box: 'w-32 h-32', svg: 128, stroke: 3, radius: 48 },
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none font-mono">
      <div className={`relative ${dimensions.box} flex items-center justify-center`}>
        {/* Ambient radial glow background */}
        <div className="absolute inset-0 rounded-full bg-linear-to-tr from-amber-500/20 via-cyan-500/10 to-transparent blur-xl animate-pulse" />

        {/* Dual-orbit SVG harmonic scanner */}
        <svg
          className="w-full h-full transform -rotate-90 relative z-10"
          viewBox={`0 0 ${dimensions.svg} ${dimensions.svg}`}
        >
          {/* Subtle Outer Track */}
          <circle
            cx={dimensions.svg / 2}
            cy={dimensions.svg / 2}
            r={dimensions.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-slate-800/80 dark:text-slate-800/80"
          />

          {/* Clockwise Amber Beam */}
          <motion.circle
            cx={dimensions.svg / 2}
            cy={dimensions.svg / 2}
            r={dimensions.radius}
            fill="none"
            stroke="url(#amberGradient)"
            strokeWidth={dimensions.stroke}
            strokeDasharray="60 140"
            strokeLinecap="round"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'linear',
            }}
            style={{ transformOrigin: 'center' }}
          />

          {/* Counter-Clockwise Cyan Orbit */}
          <motion.circle
            cx={dimensions.svg / 2}
            cy={dimensions.svg / 2}
            r={dimensions.radius * 0.72}
            fill="none"
            stroke="url(#cyanGradient)"
            strokeWidth={dimensions.stroke * 0.85}
            strokeDasharray="35 90"
            strokeLinecap="round"
            animate={{ rotate: -360 }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: 'linear',
            }}
            style={{ transformOrigin: 'center' }}
          />

          {/* SVG Linear Gradients */}
          <defs>
            <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Pulsing Kinetic Reactor Core */}
        <div className="absolute flex items-center justify-center">
          <motion.div
            className="size-4 rounded-full bg-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.8)]"
            animate={{
              scale: [1, 1.28, 1],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: 'easeInOut',
            }}
          />
          <span className="absolute size-2 rounded-full bg-white" />
        </div>
      </div>

      {/* Label and Sublabel */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 space-y-1"
        >
          <div className="text-xs font-bold tracking-wider text-slate-100 flex items-center justify-center gap-1.5 font-sans">
            <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>{label}</span>
          </div>
          {sublabel && (
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              {sublabel}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};
