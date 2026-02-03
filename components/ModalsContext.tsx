"use client";

import React, { createContext, useContext, useState } from 'react';
import { AddRecruitModal } from './modals/AddRecruitModal';
import { NewDealModal } from './modals/NewDealModal';

interface ModalContextType {
  openAddRecruit: () => void;
  openNewDeal: () => void;
  navigateTo: (page: string) => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within ModalProvider');
  }
  return context;
}

export function ModalsProvider({ children }: { children: React.ReactNode }) {
  const [isAddRecruitOpen, setIsAddRecruitOpen] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  const modalContext: ModalContextType = {
    openAddRecruit: () => setIsAddRecruitOpen(true),
    openNewDeal: () => setIsNewDealOpen(true),
    navigateTo: (page: string) => {
      // This will be handled by Next.js router instead
      console.log('Navigate to:', page);
    }
  };

  return (
    <ModalContext.Provider value={modalContext}>
      {children}

      {/* Global Modals */}
      <AddRecruitModal
        isOpen={isAddRecruitOpen}
        onClose={() => setIsAddRecruitOpen(false)}
      />

      <NewDealModal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
      />
    </ModalContext.Provider>
  );
}
