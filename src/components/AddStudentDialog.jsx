import React, { useState } from 'react';
import axios from 'axios';

// ...existing code...

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const formData = {
      timestamp: new Date().toISOString(),
      center: formValues.center,
      email: formValues.email,
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      gender: formValues.gender,
      course: formValues.course,
      class_frequency: formValues.classFrequency,
      parent_name: formValues.parentName,
      complete_address: formValues.address,
      city: formValues.city,
      state: formValues.state,
      state_code: formValues.stateCode,
      primary_phone: formValues.phone,
      emergency_contact: formValues.emergencyContact,
      blood_group: formValues.bloodGroup,
      allergies: formValues.allergies,
      refferer: formValues.referrer,
      acknowledgement: formValues.acknowledgement ? 'Yes' : 'No'
    };

    const response = await axios.post('http://localhost:8000/add-row', formData);
    
    if (response.data.message === 'Row added successfully') {
      // Clear form and close dialog
      setFormValues(initialFormValues);
      handleClose();
      // Optionally show success message
      alert('Student added successfully!');
    }
  } catch (error) {
    console.error('Error adding student:', error);
    alert('Failed to add student. Please try again.');
  }
};

// ...existing code...

export default function AddStudentDialog({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    "First Name": '',
    "Last Name": '',
    "Email": '',
    "Primary Phone Number": '',
    "Date of Birth": '',
    "Gender": '',
    "Address": '',
    "Desired Course": '',
    "Select your nearest Vama Center ": '',
    "Preferred Mode of Contact": ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/add-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Student added successfully:', result);
        onSubmit(formData); // Optional: Notify parent component
        onClose();
      } else {
        console.error('Failed to add student:', response.statusText);
      }
    } catch (error) {
      console.error('Error while adding student:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Student</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="First Name"
                value={formData["First Name"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="Last Name"
                value={formData["Last Name"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="Email"
                value={formData["Email"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="Primary Phone Number"
                value={formData["Primary Phone Number"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="Date of Birth"
                value={formData["Date of Birth"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="Gender"
                value={formData["Gender"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="Address"
                value={formData["Address"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course</label>
              <select
                name="Desired Course"
                value={formData["Desired Course"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select a course</option>
                <option value="Web Development">Guitar</option>
                <option value="Data Science">Keyboard</option>
                <option value="Mobile Development">Drums</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Center</label>
              <select
                name="Select your nearest Vama Center "
                value={formData["Select your nearest Vama Center "]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select a center</option>
                <option value="Center A">Vama - Gunjur</option>
                <option value="Center B">Vama - Varthur</option>
                <option value="Center C">Vama - Kadubeesnahali</option>
                <option value="Center C">Vama - Banaswadi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">How did you come to know about us?
              </label>
              <select
                name="Preferred Mode of Contact"
                value={formData["Preferred Mode of Contact"]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select Mode</option>
                <option value="Email">Social Media (Facebook, Instagram, etc.)</option>
                <option value="Phone">Google Search</option>
                <option value="WhatsApp">Advertisements / Billboards & Pamphlet</option>
                <option value="WhatsApp">Referred by a student of Vama Academy</option>
                <option value="WhatsApp">By Society Events</option>
                <option value="WhatsApp">Returning student</option>
                <option value="WhatsApp">Others</option>  
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
