import React from 'react';
import Dashboard from './components/Dashboard';
import { BrowserRouter, Outlet,Route,Routes } from 'react-router';
import Sidebar from './components/Sidebar';
import AllStaff from './components/AllStaff';

export default function App() {
  return (
    // <Dashboard/>
    <BrowserRouter>
      <Routes>  
        <Route path="/" element={<Sidebar/>}> 
          <Route index element={<Dashboard/>} />
          <Route path="/teacher" element={<AllStaff/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )

}
