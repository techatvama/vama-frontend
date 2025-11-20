// App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";

function SelectPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/vama-logo.png" // replace with your logo file
          alt="Vama Academy Logo"
          className="w-32 mx-auto"
        />
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">Log in</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* For students */}
        <button
          onClick={() => navigate("/login/student")}
          className="w-72 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-lg transition"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👤</span>
            <h2 className="font-semibold text-lg">For students</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Students, parents or guardians to view their profile and manage
            bookings
          </p>
        </button>

        {/* For staff */}
        <button
          onClick={() => navigate("/login/staff")}
          className="w-72 bg-gray-800 text-white rounded-xl p-6 text-left shadow-sm hover:shadow-lg transition"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">💼</span>
            <h2 className="font-semibold text-lg">For staff</h2>
          </div>
          <p className="text-gray-300 text-sm">
            Teachers, coaches or admins to manage and grow their classes
          </p>
        </button>
      </div>
    </div>
  );
}

function LoginPage({ userType }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/vama-logo.png"
          alt="Vama Academy Logo"
          className="w-32 mx-auto"
        />
      </div>

      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Sign in to your {userType} account
      </h1>

      <form className="w-full max-w-sm bg-white shadow-md rounded-xl p-6">
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlFor="email"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="********"
          />
        </div>
        <div className="mb-4 text-right">
          <a href="#" className="text-sm text-indigo-600 hover:underline">
            Forgot your password?
          </a>
        </div>
        <button
          type="submit"
          className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-500">
        Powered by <span className="font-semibold">Vama Academy</span>
      </p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<SelectPage />} />
        <Route path="/login/student" element={<LoginPage userType="student" />} />
        <Route path="/login/staff" element={<LoginPage userType="staff" />} />
      </Routes>
    </Router>
  );
}

export default App;
