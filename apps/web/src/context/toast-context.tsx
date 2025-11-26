'use client';

import React, { createContext, useContext, useRef } from 'react';
import type { ToastMessage } from 'primereact/toast';
import { Toast } from 'primereact/toast';

type ToastContextType = {
  show: (msg: ToastMessage | ToastMessage[]) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast>(null);

  const show = (msg: ToastMessage | ToastMessage[]) => {
    toastRef.current?.show(msg);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      <Toast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
