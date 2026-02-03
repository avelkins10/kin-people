"use client";

import React from "react";

export interface ProfilePageUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName?: string;
}

interface ProfilePageProps {
  user: ProfilePageUser;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Profile
          </h1>
          <p className="text-gray-500 font-medium">
            Your account details.
          </p>
        </div>
      </header>

      <div className="bg-white border border-gray-100 rounded-sm p-6 max-w-lg">
        <dl className="space-y-4">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Name
            </dt>
            <dd className="font-bold text-gray-900">{fullName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Email
            </dt>
            <dd className="font-bold text-gray-900">{user.email}</dd>
          </div>
          {user.roleName && (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Role
              </dt>
              <dd className="font-bold text-gray-900">{user.roleName}</dd>
            </div>
          )}
        </dl>
      </div>
    </>
  );
}
