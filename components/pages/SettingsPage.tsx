"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Shield,
  MapPin,
  DollarSign,
  Plus,
  Edit2,
  Trash2 } from
'lucide-react';
export function SettingsPage() {
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Settings
          </h1>
          <p className="text-gray-500 font-medium">
            Configure roles, offices, and compensation plans.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roles Section */}
        <div className="bg-white border border-gray-100 rounded-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                Roles
              </h3>
            </div>
            <button className="p-1 hover:bg-gray-50 rounded-sm">
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            {[
            'Admin',
            'Regional Manager',
            'Office Manager',
            'Team Lead',
            'Sales Rep'].
            map((role) =>
            <div
              key={role}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group">

                <span className="font-bold text-sm text-gray-700">{role}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:text-indigo-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Offices Section */}
        <div className="bg-white border border-gray-100 rounded-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                Offices
              </h3>
            </div>
            <button className="p-1 hover:bg-gray-50 rounded-sm">
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            {[
            {
              name: 'Phoenix HQ',
              region: 'West'
            },
            {
              name: 'Denver',
              region: 'Mountain'
            },
            {
              name: 'Austin',
              region: 'South'
            },
            {
              name: 'Dallas',
              region: 'South'
            }].
            map((office) =>
            <div
              key={office.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group">

                <div>
                  <span className="font-bold text-sm text-gray-700 block">
                    {office.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    {office.region}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:text-indigo-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pay Plans Section */}
        <div className="bg-white border border-gray-100 rounded-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                Pay Plans
              </h3>
            </div>
            <button className="p-1 hover:bg-gray-50 rounded-sm">
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            {[
            {
              name: 'Standard Rep 2024',
              active: true
            },
            {
              name: 'Team Lead Override',
              active: true
            },
            {
              name: 'Manager Base + Com',
              active: true
            },
            {
              name: 'Legacy Plan 2023',
              active: false
            }].
            map((plan) =>
            <div
              key={plan.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group">

                <div>
                  <span className="font-bold text-sm text-gray-700 block">
                    {plan.name}
                  </span>
                  <span
                  className={`text-[10px] font-bold uppercase ${plan.active ? 'text-green-600' : 'text-gray-400'}`}>

                    {plan.active ? 'Active' : 'Archived'}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:text-indigo-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>);

}