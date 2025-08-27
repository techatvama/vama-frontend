// import React, { useState } from 'react';
// import axios from 'axios';

// // ...existing code...

// const handleSubmit = async (e) => {
//   e.preventDefault();
  
//   try {
//     const formData = {
//       timestamp: new Date().toISOString(),
//       center: formValues.center,
//       email: formValues.email,
//       first_name: formValues.firstName,
//       last_name: formValues.lastName,
//       gender: formValues.gender,
//       course: formValues.course,
//       class_frequency: formValues.classFrequency,
//       parent_name: formValues.parentName,
//       complete_address: formValues.address,
//       city: formValues.city,
//       state: formValues.state,
//       state_code: formValues.stateCode,
//       primary_phone: formValues.phone,
//       emergency_contact: formValues.emergencyContact,
//       blood_group: formValues.bloodGroup,
//       allergies: formValues.allergies,
//       refferer: formValues.referrer,
//       acknowledgement: formValues.acknowledgement ? 'Yes' : 'No'
//     };

//     const response = await axios.post('http://localhost:8000/add-row', formData);
    
//     if (response.data.message === 'Row added successfully') {
//       // Clear form and close dialog
//       setFormValues(initialFormValues);
//       handleClose();
//       // Optionally show success message
//       alert('Student added successfully!');
//     }
//   } catch (error) {
//     console.error('Error adding student:', error);
//     alert('Failed to add student. Please try again.');
//   }
// };

// // ...existing code...

// export default function AddStudentDialog({ isOpen, onClose, onSubmit }) {
//   const [formData, setFormData] = useState({
//     "First Name": '',
//     "Last Name": '',
//     "Email": '',
//     "Primary Phone Number": '',
//     "Date of Birth": '',
//     "Gender": '',
//     "Address": '',
//     "Desired Course": '',
//     "Select your nearest Vama Center ": '',
//     "Preferred Mode of Contact": ''
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:8000/add-row', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         console.log('Student added successfully:', result);
//         onSubmit(formData); // Optional: Notify parent component
//         onClose();
//       } else {
//         console.error('Failed to add student:', response.statusText);
//       }
//     } catch (error) {
//       console.error('Error while adding student:', error);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">Add New Student</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             ✕
//           </button>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">First Name</label>
//               <input
//                 type="text"
//                 name="First Name"
//                 value={formData["First Name"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Last Name</label>
//               <input
//                 type="text"
//                 name="Last Name"
//                 value={formData["Last Name"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Email</label>
//               <input
//                 type="email"
//                 name="Email"
//                 value={formData["Email"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Phone Number</label>
//               <input
//                 type="tel"
//                 name="Primary Phone Number"
//                 value={formData["Primary Phone Number"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
//               <input
//                 type="date"
//                 name="Date of Birth"
//                 value={formData["Date of Birth"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Gender</label>
//               <select
//                 name="Gender"
//                 value={formData["Gender"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               >
//                 <option value="">Select Gender</option>
//                 <option value="Male">Male</option>
//                 <option value="Female">Female</option>
//                 <option value="Other">Other</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Address</label>
//               <textarea
//                 name="Address"
//                 value={formData["Address"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 rows="3"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Course</label>
//               <select
//                 name="Desired Course"
//                 value={formData["Desired Course"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               >
//                 <option value="">Select a course</option>
//                 <option value="Web Development">Guitar</option>
//                 <option value="Data Science">Keyboard</option>
//                 <option value="Mobile Development">Drums</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Center</label>
//               <select
//                 name="Select your nearest Vama Center "
//                 value={formData["Select your nearest Vama Center "]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               >
//                 <option value="">Select a center</option>
//                 <option value="Center A">Vama - Gunjur</option>
//                 <option value="Center B">Vama - Varthur</option>
//                 <option value="Center C">Vama - Kadubeesnahali</option>
//                 <option value="Center C">Vama - Banaswadi</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">How did you come to know about us?
//               </label>
//               <select
//                 name="Preferred Mode of Contact"
//                 value={formData["Preferred Mode of Contact"]}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
//                 required
//               >
//                 <option value="">Select Mode</option>
//                 <option value="Email">Social Media (Facebook, Instagram, etc.)</option>
//                 <option value="Phone">Google Search</option>
//                 <option value="WhatsApp">Advertisements / Billboards & Pamphlet</option>
//                 <option value="WhatsApp">Referred by a student of Vama Academy</option>
//                 <option value="WhatsApp">By Society Events</option>
//                 <option value="WhatsApp">Returning student</option>
//                 <option value="WhatsApp">Others</option>  
//               </select>
//             </div>
//           </div>

//           <div className="mt-6 flex justify-end space-x-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//             >
//               Add Student
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";

export default function AddStudentDialog({ isOpen, onClose, onSubmit }) {
  const initialFormValues = {
    center: "",
    email: "",
    first_name: "",
    last_name: "",
    gender: "",
    course: "",
    class_frequency: "",
    parent_name: "",
    complete_address: "",
    city: "",
    state: "",
    state_code: "",
    primary_phone: "",
    emergency_contact: "",
    blood_group: "",
    allergies: "",
    refferer: "",
    acknowledgement: false,
  };

  const [formValues, setFormValues] = useState(initialFormValues);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      timestamp: new Date().toISOString(),
      ...formValues,
      acknowledgement: formValues.acknowledgement ? "Yes" : "No",
    };

    try {
      const response = await axios.post("http://localhost:8000/add-row", formData);

      if (response.data.message === "Row added successfully") {
        setFormValues(initialFormValues);
        onClose();
        alert("Student added successfully!");
        navigate(0);
        if (onSubmit) onSubmit(formData);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
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
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formValues.first_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formValues.last_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Primary Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Phone</label>
              <input
                type="tel"
                name="primary_phone"
                value={formValues.primary_phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
              <input
                type="tel"
                name="emergency_contact"
                value={formValues.emergency_contact}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={formValues.gender}
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

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Name</label>
              <input
                type="text"
                name="parent_name"
                value={formValues.parent_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Complete Address</label>
              <textarea
                name="complete_address"
                value={formValues.complete_address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formValues.city}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                value={formValues.state}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* State Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700">State Code</label>
              <input
                type="text"
                name="state_code"
                value={formValues.state_code}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Desired Course</label>
              <select
                name="course"
                value={formValues.course}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select a course</option>
                <option value="Guitar">Guitar</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Drums">Drums</option>
              </select>
            </div>

            {/* Class Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Frequency</label>
              <select
                name="class_frequency"
                value={formValues.class_frequency}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select Frequency</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            {/* Center */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Center</label>
              <select
                name="center"
                value={formValues.center}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select a center</option>
                <option value="Vama - Gunjur">Vama - Gunjur</option>
                <option value="Vama - Varthur">Vama - Varthur</option>
                <option value="Vama - Kadubeesnahali">Vama - Kadubeesnahali</option>
                <option value="Vama - Banaswadi">Vama - Banaswadi</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
              <input
                type="text"
                name="blood_group"
                value={formValues.blood_group}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Allergies</label>
              <input
                type="text"
                name="allergies"
                value={formValues.allergies}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Referrer */}
            <div>
              <label className="block text-sm font-medium text-gray-700">How did you hear about us?</label>
              <select
                name="refferer"
                value={formValues.refferer}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select Option</option>
                <option value="Social Media">Social Media</option>
                <option value="Google Search">Google Search</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Referral">Referral</option>
                <option value="Event">Event</option>
                <option value="Returning Student">Returning Student</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Acknowledgement */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="acknowledgement"
                checked={formValues.acknowledgement}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                I acknowledge the information is correct
              </label>
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
