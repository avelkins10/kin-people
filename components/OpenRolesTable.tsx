import React from 'react';
type RoleStatus = 'Active' | 'Paused' | 'Filled';
interface Role {
  id: string;
  title: string;
  department: string;
  applicants: number;
  status: RoleStatus;
  posted: string;
}
const roles: Role[] = [
{
  id: '1',
  title: 'Senior Solar Tech',
  department: 'Field Ops',
  applicants: 12,
  status: 'Active',
  posted: '2d ago'
},
{
  id: '2',
  title: 'Sales Representative',
  department: 'Sales',
  applicants: 28,
  status: 'Active',
  posted: '5d ago'
},
{
  id: '3',
  title: 'Account Manager',
  department: 'Sales',
  applicants: 8,
  status: 'Paused',
  posted: '1w ago'
},
{
  id: '4',
  title: 'Installation Lead',
  department: 'Field Ops',
  applicants: 45,
  status: 'Filled',
  posted: '2w ago'
},
{
  id: '5',
  title: 'Recruiter',
  department: 'HR',
  applicants: 15,
  status: 'Active',
  posted: '3d ago'
}];

export function OpenRolesTable() {
  const getStatusStyles = (status: RoleStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Paused':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Filled':
        return 'bg-black text-white border border-black';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  return (
    <div className="w-full bg-white border border-gray-100 rounded-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
          Open Positions
        </h3>
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide">
          View All Roles
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Applicants
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Posted
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.map((role) =>
            <tr
              key={role.id}
              className="hover:bg-gray-50 transition-colors group">

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-bold text-black">{role.title}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                  {role.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-mono font-bold text-black">
                      {role.applicants}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      candidates
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-sm uppercase tracking-wide ${getStatusStyles(role.status)}`}>

                    {role.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {role.posted}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}