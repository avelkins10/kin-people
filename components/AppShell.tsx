"use client";

import React, { useState } from 'react';
import { Sidebar, Page } from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface AppShellProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
}
export function AppShell({ children, activePage, onNavigate }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-black text-white rounded-sm shadow-lg">

          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden lg:block">
        <Sidebar
          isOpen={true}
          activePage={activePage}
          onNavigate={onNavigate} />

      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <Sidebar
          isOpen={true}
          activePage={activePage}
          onNavigate={(page) => {
            onNavigate(page);
            setSidebarOpen(false);
          }} />

        <div
          className="absolute inset-0 bg-black/50 -z-10"
          onClick={() => setSidebarOpen(false)} />

      </div>

      <main className="lg:pl-64 min-h-screen transition-all duration-300 flex flex-col">
        <div className="max-w-[1800px] mx-auto p-6 lg:p-8 w-full flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              transition={{
                duration: 0.2
              }}
              className="flex-1 flex flex-col">

              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>);

}