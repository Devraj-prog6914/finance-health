import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Users, Sliders, ShieldCheck, Bot, Sparkles, LayoutDashboard,
  FileSpreadsheet, Key, Menu, X, Compass, GraduationCap, Building2, UserPlus, RefreshCw
} from 'lucide-react';

import { MSME } from './types';
import { PitchScreen } from './features/PitchScreen';
import { OverviewDashboard } from './features/OverviewDashboard';
import { OnboardingConsent } from './features/OnboardingConsent';
import { RMDashboard } from './features/RMDashboard';
import { WhatIfSimulator } from './features/WhatIfSimulator';
import { ApplicantView } from './features/ApplicantView';
import { DemoMode } from './features/DemoMode';
import { VisualAnalytics } from './features/VisualAnalytics';
import { CopilotChat } from './components/CopilotChat';

type ViewType = 'Pitch' | 'Overview' | 'RM' | 'Simulator' | 'Applicant' | 'Analytics' | 'Demo' | 'Onboarding';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('Pitch');
  const [msmes, setMsmes] = useState<MSME[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Copilot Controls
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotMsme, setCopilotMsme] = useState<MSME | null>(null);

  // ULI Global Sandbox Connection Status
  const [uliConnected, setUliConnected] = useState(false);

  // Selected MSME for Relationship Manager Dashboard
  const [selectedMsmeIdForRm, setSelectedMsmeIdForRm] = useState<string | undefined>(undefined);

  // Load MSMEs list
  useEffect(() => {
    fetchMSMEs();
  }, []);

  const fetchMSMEs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/msmes');
      const data = await response.json();
      if (response.ok) {
        setMsmes(data);
      }
    } catch (err) {
      console.error("Error fetching MSMEs ledger: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleOpenCopilot = (msme: MSME) => {
    setCopilotMsme(msme);
    setCopilotOpen(true);
  };

  const handleDemoComplete = async (msme: MSME) => {
    await fetchMSMEs();
    setSelectedMsmeIdForRm(msme.id);
    setCurrentView('RM');
  };

  const menuItems = [
    { view: 'Overview' as ViewType, label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'RM' as ViewType, label: 'Relationship Ledger', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { view: 'Simulator' as ViewType, label: 'What-If Simulator', icon: <Sliders className="w-4 h-4" /> },
    { view: 'Applicant' as ViewType, label: 'MSME Applicant Portal', icon: <Users className="w-4 h-4" /> },
    { view: 'Analytics' as ViewType, label: 'Advanced Analytics', icon: <Compass className="w-4 h-4" /> },
    { view: 'Demo' as ViewType, label: 'Cinematic Demo Mode', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  if (currentView === 'Pitch') {
    return <PitchScreen onEnter={() => setCurrentView('Overview')} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden grid-bg">
      
      {/* 1. Desktop Sidebar Navigation (Hidden on mobile) */}
      <aside className="w-64 border-r border-slate-200/50 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex z-10">
        <div className="p-4 space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-brand-green-600 flex items-center justify-center font-display text-white font-bold shadow-md shadow-brand-green-500/10">
              ⚡
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">CreditPulse</span>
              <span className="text-[9px] block text-brand-green-600 dark:text-brand-green-400 font-semibold uppercase tracking-wider mt-[-2px]">
                IDBI Hackathon
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map(item => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  currentView === item.view
                    ? 'bg-brand-green-600 text-white shadow-md shadow-brand-green-500/10'
                    : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/20 rounded-xl">
            <button
              onClick={() => setDarkMode(false)}
              className={`p-1.5 rounded-lg flex-1 flex justify-center ${!darkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-saffron-500' : 'text-slate-400'}`}
              title="Light Mode"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={`p-1.5 rounded-lg flex-1 flex justify-center ${darkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-saffron-500' : 'text-slate-400'}`}
              title="Dark Mode"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 text-center font-semibold tracking-wider">
            IDBI INNOVATE • 2026
          </div>
        </div>
      </aside>

      {/* 2. Mobile Side Drawer Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-xs h-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-800/20 shadow-2xl flex flex-col justify-between p-4"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-green-600 flex items-center justify-center font-display text-white font-bold shadow-md shadow-brand-green-500/10">
                      ⚡
                    </div>
                    <div>
                      <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">CreditPulse</span>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-650">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {menuItems.map(item => (
                    <button
                      key={item.view}
                      onClick={() => {
                        setCurrentView(item.view);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                        currentView === item.view
                          ? 'bg-brand-green-600 text-white shadow-md'
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 rounded-xl">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${!darkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-saffron-500' : 'text-slate-400'}`}
                  >
                    <Sun className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setDarkMode(true)}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${darkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-saffron-500' : 'text-slate-400'}`}
                  >
                    <Moon className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 text-center font-semibold uppercase">
                  IDBI INNOVATE • 2026
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto pb-16 md:pb-0">
        
        {/* Top Header bar with mobile burger trigger */}
        <header className="px-4 md:px-8 py-4 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex justify-between items-center sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xs md:text-sm font-bold font-display text-slate-850 dark:text-white tracking-tight uppercase">
              {currentView === 'Overview' && 'Portfolio Overview'}
              {currentView === 'RM' && 'Relationship Manager Ledger'}
              {currentView === 'Simulator' && 'What-If Score Simulator'}
              {currentView === 'Applicant' && 'Applicant Self-Service Portal'}
              {currentView === 'Analytics' && 'Advanced Credit Analytics'}
              {currentView === 'Demo' && 'Interactive Presentation Guide'}
              {currentView === 'Onboarding' && 'Digital MSME Connection'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] md:text-xs font-semibold">
            {/* ULI Connectivity tag */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
              uliConnected ? 'bg-orange-50 text-brand-saffron-600 dark:bg-orange-950/20 dark:text-brand-saffron-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}>
              {uliConnected ? 'ULI Connected' : 'ULI Sandbox Off'}
            </span>
            <span className="text-slate-350">|</span>
            <span className="text-slate-450 hidden sm:inline">{msmes.length} Profiles</span>
          </div>
        </header>

        {/* View Main Content */}
        <div className="p-4 md:p-8 flex-1 min-h-0">
          {isLoading && msmes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <RefreshCw className="w-8 h-8 text-brand-green-600 animate-spin" />
              <h4 className="text-sm font-semibold text-slate-500">Loading Alternate Data...</h4>
            </div>
          ) : (
            <div className="h-full">
              {currentView === 'Overview' && (
                <OverviewDashboard
                  msmes={msmes}
                  onOnboardClick={() => setCurrentView('Onboarding')}
                  onSelectMSME={(id) => {
                    setSelectedMsmeIdForRm(id);
                    setCurrentView('RM');
                  }}
                />
              )}
              {currentView === 'RM' && (
                <RMDashboard
                  msmes={msmes}
                  onRefresh={fetchMSMEs}
                  onOpenCopilot={handleOpenCopilot}
                  initialSelectedId={selectedMsmeIdForRm}
                />
              )}
              {currentView === 'Simulator' && <WhatIfSimulator msmes={msmes} />}
              {currentView === 'Applicant' && (
                <ApplicantView
                  msmes={msmes}
                  onOpenCopilot={handleOpenCopilot}
                />
              )}
              {currentView === 'Analytics' && <VisualAnalytics msmes={msmes} />}
              {currentView === 'Demo' && (
                <DemoMode
                  msmes={msmes}
                  onDemoComplete={handleDemoComplete}
                />
              )}
              {currentView === 'Onboarding' && (
                <OnboardingConsent
                  onOnboarded={async () => {
                    await fetchMSMEs();
                    setCurrentView('RM');
                  }}
                  onCancel={() => setCurrentView('Overview')}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating CFO AI Trigger Bubble */}
      {msmes.length > 0 && currentView !== 'Onboarding' && (
        <button
          onClick={() => handleOpenCopilot(copilotMsme || msmes[0])}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-brand-saffron-500 hover:bg-brand-saffron-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 animate-pulse-slow"
          title="Open AI Copilot Chat"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Floating sliding drawer Chat Component */}
      <CopilotChat
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        msme={copilotMsme || (msmes.length > 0 ? msmes[0] : null)}
      />
    </div>
  );
}


