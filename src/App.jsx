import React from 'react';
import Dashboard from './components/Dashboard';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import Sidebar from './components/Sidebar';
import AllStaff from './components/AllStaff';
import StudentProgressEditor from './components/StudentProgressEditor';
import Scheduler from './components/scheduling/Scheduler';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Sidebar />}>
          <Route index element={<Dashboard />} />
          <Route path="/teacher" element={<AllStaff />} />
          <Route path="/teacher/add" element={<AllStaff />} />
          <Route path="/teacher/progress" element={<StudentProgressEditor />} />
          <Route path="/students" element={<Dashboard />} />
          <Route path="/students/add" element={<Dashboard />} />
          <Route path="/students/enrollments" element={<div className="p-8"><h1 className="text-2xl font-bold">Enrollments module coming soon</h1></div>} />
          <Route path="/schedule" element={<Scheduler />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )

}
