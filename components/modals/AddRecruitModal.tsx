import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
interface AddRecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function AddRecruitModal({ isOpen, onClose }: AddRecruitModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Recruit"
      footer={
      <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Add Recruit</Button>
        </>
      }>

      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              First Name
            </label>
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Jane" />

          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Last Name
            </label>
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Doe" />

          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
            Email Address
          </label>
          <input
            type="email"
            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="jane@example.com" />

        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Target Role
            </label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Sales Rep</option>
              <option>Team Lead</option>
              <option>Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Target Office
            </label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Phoenix HQ</option>
              <option>Denver</option>
              <option>Austin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
            Source
          </label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>Referral</option>
            <option>LinkedIn</option>
            <option>Indeed</option>
            <option>Direct</option>
          </select>
        </div>
      </form>
    </Modal>);

}