import React from 'react';
type DealStatus = 'Won' | 'Pending' | 'Lost';
interface Deal {
  id: string;
  company: string;
  value: string;
  status: DealStatus;
  date: string;
  owner: string;
}
const deals: Deal[] = [
{
  id: '1',
  company: 'Acme Corp',
  value: '$12,500',
  status: 'Won',
  date: 'Oct 24, 2023',
  owner: 'Sarah J.'
},
{
  id: '2',
  company: 'Global Tech',
  value: '$8,200',
  status: 'Pending',
  date: 'Oct 23, 2023',
  owner: 'Mike R.'
},
{
  id: '3',
  company: 'Stark Ind',
  value: '$45,000',
  status: 'Pending',
  date: 'Oct 22, 2023',
  owner: 'Sarah J.'
},
{
  id: '4',
  company: 'Wayne Ent',
  value: '$22,100',
  status: 'Lost',
  date: 'Oct 21, 2023',
  owner: 'John D.'
},
{
  id: '5',
  company: 'Cyberdyne',
  value: '$15,800',
  status: 'Won',
  date: 'Oct 20, 2023',
  owner: 'Mike R.'
}];

export function DealsTable() {
  const getStatusStyles = (status: DealStatus) => {
    switch (status) {
      case 'Won':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Pending':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Lost':
        return 'bg-black text-white border border-black';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  return (
    <div className="w-full bg-white border border-gray-100 rounded-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold tracking-tight text-black">
          Recent Deals
        </h3>
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Owner
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deals.map((deal) =>
            <tr
              key={deal.id}
              className="hover:bg-gray-50 transition-colors group">

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-bold text-black">{deal.company}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                  {deal.value}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-sm ${getStatusStyles(deal.status)}`}>

                    {deal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {deal.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold mr-2 text-gray-600">
                      {deal.owner.charAt(0)}
                    </div>
                    {deal.owner}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}