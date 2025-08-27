import React from 'react';
import Dashboard from './components/Dashboard';
import { BrowserRouter, Outlet,Route,Routes } from 'react-router';
import Sidebar from './components/Sidebar';

export default function App() {
  return (
    // <Dashboard/>
    <BrowserRouter>
      <Routes>  
        <Route path="/" element={<Sidebar/>}> 
          <Route index element={<Dashboard/>} />
          <Route path="/teacher" element={<h1>Teacher work in progress</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )

}
