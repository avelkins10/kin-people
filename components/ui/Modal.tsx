import React, { Fragment } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:p-0">
      <div className="relative w-full max-w-lg max-h-full rounded-sm bg-white shadow-2xl ring-1 ring-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 md:p-5">
          <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-sm bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">

            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer &&
        <div className="flex items-center justify-end space-x-2 border-t border-gray-100 p-4 md:p-5 rounded-b-sm">
            {footer}
          </div>
        }
      </div>
    </div>);

}