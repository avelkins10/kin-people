import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function NewDealModal({ isOpen, onClose }: NewDealModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Deal"
      footer={
      <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Create Deal</Button>
        </>
      }>

      <form className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Homeowner Name" />

        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Deal Type
            </label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Solar</option>
              <option>HVAC</option>
              <option>Roofing</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              System Size (kW)
            </label>
            <input
              type="number"
              className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="8.4" />

          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Total Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-200 rounded-sm pl-6 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="32,000" />

            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Contract Date
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" />

          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Setter
            </label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Select Rep...</option>
              <option>James Chen</option>
              <option>Emily Davis</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Closer
            </label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Select Rep...</option>
              <option>Sarah Jenkins</option>
              <option>Mike Ross</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>);

}