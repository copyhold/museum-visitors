
import React from 'react';
import { Visit, EventType, AgeGroupCounts } from '../types';
import { AGE_GROUP_KEYS, AGE_GROUP_LABELS } from '../constants';

interface VisitListProps {
  visits: Visit[];
  eventTypes: EventType[];
  onEdit: (visit: Visit) => void;
  onDelete: (id: number) => void;
  onExportCSV: () => void;
}

const VisitList: React.FC<VisitListProps> = ({ visits, eventTypes, onEdit, onDelete, onExportCSV }) => {
  const getEventTypeName = (id: number): string => {
    const eventType = eventTypes.find(et => et.id === id);
    return eventType ? eventType.name : 'Unknown';
  };

  if (visits.length === 0) {
    return <div className="text-center text-gray-500 py-8">No visits recorded yet.</div>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 sm:mb-0">Manage Visits</h2>
        <button
          onClick={onExportCSV}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition duration-150 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export to CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Desc.</th>
              {AGE_GROUP_KEYS.map(key => (
                <th key={key} scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">{AGE_GROUP_LABELS[key].substring(0,3)}</th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visits.map(visit => (
              <tr key={visit.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.visit_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={visit.group_description || ''}>{visit.group_description || '-'}</td>
                {AGE_GROUP_KEYS.map(key => (
                  <td key={key} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">{visit[key as keyof AgeGroupCounts]}</td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEventTypeName(visit.event_type_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => onEdit(visit)} className="text-indigo-600 hover:text-indigo-900 transition duration-150">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(visit.id)} className="text-red-600 hover:text-red-900 transition duration-150">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.242.26m-3.242-.26L6.636 19.673a2.25 2.25 0 002.244 2.077H15.12a2.25 2.25 0 002.244-2.077L19.228 5.79m-14.456 0c.096 1.036.24 2.04.434 3.006m13.592-3.006c.194.966.338 1.97.434 3.006M12 12.75h.008v.008H12v-.008z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitList;
