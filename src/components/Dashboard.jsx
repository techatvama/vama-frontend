// import React, { useState, useEffect } from "react";
// import { api } from "../lib/api";
// import Sidebar from "./Sidebar";

// export default function Dashboard() {
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError]     = useState(null);

//   useEffect(() => {
//     api.get("/read-sheet")
//       .then(res => {
//         console.log(res.data.data)
//         if (Array.isArray(res.data.data)) setRecords(res.data.data);
        
//         else throw new Error("Invalid data");
//       })
//       .catch(err => setError(err.message || "Fetch failed"))
//       .finally(() => setLoading(false));
//   }, []);

//   return (
//     <div className="flex">
//       <Sidebar />

//       <main className="flex-1 p-6 bg-gray-50 min-h-screen">
//         <h1 className="text-3xl font-semibold mb-4">Student Dashboard</h1>
//         {loading && <p>Loading…</p>}
//         {error   && <p className="text-red-500">Error: {error}</p>}

//         {!loading && !error && (
//           <div className="overflow-auto bg-white shadow rounded">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-100">
//                 <tr>{Object.keys(records[0]).map((columnName) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">{columnName}</th>)}
                  
//                   {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
//                   <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Course</th>
//                   <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone/th>
//                   <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Joined</th> */}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {records.map((r, i) => (
//                   <tr key={i} className="hover:bg-gray-50">
//                     {Object.values(r).map((value) => <td className="px-4 py-2">{value}</td> )}
//                     {/* <td className="px-4 py-2">{r.first_name} {r.last_name}</td>
                    
//                     <td className="px-4 py-2">{r.course}</td>
//                     <td className="px-4 py-2">{r.primary_phone}</td>
//                     <td className="px-4 py-2">{r.timestamp}</td> */}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </main>
//     </div>
// );
// }

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import Sidebar from "./Sidebar";
import AddStudentDialog from "./AddStudentDialog";
import { LucideFileSpreadsheet } from "lucide-react";

export default function Dashboard() {
  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Constants
  const recordsPerPage = 10;
  const columnConfig = {
    "Timestamp": "Joined On",
    "Email": "Email",
    "First Name": "First Name",
    "Last Name": "Last Name",
    "Desired Course": "Course",
    "Primary Phone Number": "Phone",
    "Select your nearest Vama Center ": "Center"
  };

  // Data fetching
  useEffect(() => {
    api.get("/read-sheet")
      .then(res => {
        if (Array.isArray(res.data.data)) setRecords(res.data.data);
        else throw new Error("Invalid data");
      })
      .catch(err => setError(err.message || "Fetch failed"))
      .finally(() => setLoading(false));
  }, []);

  // Data processing
  const filteredRecords = records.filter(record => 
    Object.values(record).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === bValue) return 0;
    return (aValue > bValue ? 1 : -1) * (sortConfig.direction === 'asc' ? 1 : -1);
  });

  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Event handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Pagination controls
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const [addaction,setaddaction] = useState(false)

  return (
    <div className="flex">
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        <AddStudentDialog isOpen={addaction} onClose={()=> setaddaction(false)}/>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Students Dashboard</h1>
          <p className="text-gray-600">Manage all registered students</p>
        </div>

        {loading && (
          <div className="flex justify-center p-8">
            <div className="text-gray-500">Loading data...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <input
                type="search"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search students..."
                className="px-4 py-2 border rounded-md w-64"
              />
              <button  onClick={()=> setaddaction(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                Add New Student
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.values(columnConfig).map((header) => (
                      <th 
                        key={header}
                        onClick={() => handleSort(header)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        {header}
                        {sortConfig.key === header && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record, idx) => (
                    <tr 
                      key={record.Email || idx} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {Object.keys(columnConfig).map((key) => (
                        <td 
                          key={key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {record[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedRecords.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found
              </div>
            )}

            {paginatedRecords.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length} results
                </div>
                <div className="flex gap-2">
                  {pageNumbers.map(number => (
                    <button
                      key={number}
                      onClick={() => handlePageChange(number)}
                      className={`px-3 py-1 rounded ${
                        currentPage === number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
