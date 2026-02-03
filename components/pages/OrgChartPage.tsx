"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import {
  GitBranch,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  User,
  MapPin } from
'lucide-react';
interface OrgNode {
  id: string;
  name: string;
  role: string;
  office: string;
  teamSize: number;
  avatar?: string;
  children?: OrgNode[];
}
const orgData: OrgNode = {
  id: '1',
  name: 'Michael Scott',
  role: 'Regional Manager',
  office: 'Dallas',
  teamSize: 42,
  children: [
  {
    id: '2',
    name: 'Sarah Jenkins',
    role: 'Team Lead',
    office: 'Phoenix HQ',
    teamSize: 12,
    children: [
    {
      id: '4',
      name: 'James Chen',
      role: 'Sales Rep',
      office: 'Phoenix HQ',
      teamSize: 0
    },
    {
      id: '5',
      name: 'Dwight Schrute',
      role: 'Sales Rep',
      office: 'Phoenix HQ',
      teamSize: 0
    }]

  },
  {
    id: '3',
    name: 'Mike Ross',
    role: 'Team Lead',
    office: 'Denver',
    teamSize: 8,
    children: [
    {
      id: '6',
      name: 'Emily Davis',
      role: 'Sales Rep',
      office: 'Denver',
      teamSize: 0
    }]

  }]

};
function OrgNodeCard({ node }: {node: OrgNode;}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-64 bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group p-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
            {node.name.
            split(' ').
            map((n) => n[0]).
            join('')}
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
              {node.name}
            </h4>
            <p className="text-xs font-medium text-indigo-600 mt-0.5">
              {node.role}
            </p>
            <div className="flex items-center text-[10px] text-gray-500 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {node.office}
            </div>
          </div>
        </div>
        {node.teamSize > 0 &&
        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">
              Team
            </span>
            <span className="text-xs font-bold text-black flex items-center">
              <User className="w-3 h-3 mr-1 text-gray-400" />
              {node.teamSize}
            </span>
          </div>
        }
      </div>
      {node.children && node.children.length > 0 &&
      <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="flex gap-8 relative">
            {/* Horizontal connecting line */}
            <div className="absolute top-0 left-32 right-32 h-px bg-gray-300 -translate-y-px"></div>
            {node.children.map((child) =>
          <div
            key={child.id}
            className="flex flex-col items-center pt-8 relative">

                {/* Vertical line from horizontal bar to child */}
                <div className="absolute top-0 left-1/2 h-8 w-px bg-gray-300 -translate-x-1/2"></div>
                <OrgNodeCard node={child} />
              </div>
          )}
          </div>
        </div>
      }
    </div>);

}
export function OrgChartPage() {
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Organization Chart
          </h1>
          <p className="text-gray-500 font-medium">
            Visualize team hierarchy and reporting structure.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Search className="w-4 h-4" />}>
            Find Person
          </Button>
          <Button icon={<GitBranch className="w-4 h-4" />}>Export Chart</Button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex justify-between items-center mb-8 p-4 bg-white border border-gray-100 rounded-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">
              View:
            </span>
            <button className="flex items-center text-sm font-bold text-black hover:text-indigo-600 transition-colors">
              Reports To
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">
              Office:
            </span>
            <button className="flex items-center text-sm font-bold text-black hover:text-indigo-600 transition-colors">
              All Offices
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-50 rounded-sm text-gray-500 hover:text-black transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-sm text-gray-500 hover:text-black transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-gray-50 border border-gray-100 rounded-sm p-12 overflow-auto min-h-[600px] flex justify-center items-start">
        <OrgNodeCard node={orgData} />
      </div>
    </>);

}