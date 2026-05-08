import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "../lib/api";

export default function AddStudentDialog({ isOpen, onClose, onSubmit, initialData }) {
  // Define initial state matching the user's desired structure
  const initialFormValues = {
    first_name: "",
    last_name: "",
    email: "",
    primary_phone: "",
    emergency_contact: "",
    gender: "",
    dob: "", // Added DOB as it's standard even if not in user's snippet, but will keep it optional
    parent_name: "", // New
    complete_address: "", // Maps to address
    city: "", // New
    state: "", // New
    state_code: "", // New
    course: "", // Maps to desired_course
    class_frequency: "", // New
    center: "", // Maps to nearest_vama_center
    blood_group: "", // New
    allergies: "", // New
    referrer: "", // New (corrected spelling from refferer)
    contact_mode: "", // Re-added for backend compatibility
    acknowledgement: false,
  };

  const [formValues, setFormValues] = useState(initialFormValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      if (initialData) {
        // Map backend/dashboard data to form state
        setFormValues({
          first_name: initialData.first_name || initialData["First Name"] || "",
          last_name: initialData.last_name || initialData["Last Name"] || "",
          email: initialData.email || initialData["Email"] || "",
          primary_phone: initialData.primary_phone_number || initialData["Primary Phone Number"] || "",
          emergency_contact: initialData.emergency_contact || "",
          gender: initialData.gender || "",
          dob: initialData.date_of_birth || initialData["Date of Birth"] || "",
          parent_name: initialData.parent_name || "",
          complete_address: initialData.address || initialData["Address"] || "",
          city: initialData.city || "",
          state: initialData.state || "",
          state_code: initialData.state_code || "",
          course: initialData.desired_course || initialData["Desired Course"] || "",
          class_frequency: initialData.class_frequency || "",
          center: initialData.nearest_vama_center || initialData["Select your nearest Vama Center "] || "",
          blood_group: initialData.blood_group || "",
          allergies: initialData.allergies || "",
          referrer: initialData.referrer || "",
          contact_mode: initialData.preferred_mode_of_contact || initialData["Preferred Mode of Contact"] || "",
          acknowledgement: false,
        });
      } else {
        setFormValues(initialFormValues);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Map to Student Backend Schema (snake_case)
    const payload = {
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      email: formValues.email,
      primary_phone_number: formValues.primary_phone,
      date_of_birth: formValues.dob,
      gender: formValues.gender,
      address: formValues.complete_address,
      desired_course: formValues.course,
      nearest_vama_center: formValues.center,
      preferred_mode_of_contact: formValues.contact_mode,

      // Extra fields
      parent_name: formValues.parent_name,
      city: formValues.city,
      state: formValues.state,
      state_code: formValues.state_code,
      class_frequency: formValues.class_frequency,
      emergency_contact: formValues.emergency_contact,
      blood_group: formValues.blood_group,
      allergies: formValues.allergies,
      referrer: formValues.referrer,
    };

    try {
      let updatedStudent = null;
      if (initialData && initialData.id) {
        // Edit Mode — response is the full updated student object
        const res = await api.put(`/students/${initialData.id}`, payload);
        updatedStudent = res.data;
      } else {
        // Add Mode
        await api.post("/add-student", payload);
      }

      // Pass the updated student back so parent can update local state
      // without a full re-fetch
      if (onSubmit) await onSubmit(updatedStudent);
      onClose();
    } catch (err) {
      console.error("Error saving student:", err);
      // Handle array of errors or simple detail string
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(", ")
        : (detail || "Failed to save student. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? 'Edit Student Details' : 'Add New Student'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formValues.first_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                  placeholder="Jane"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formValues.last_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                  placeholder="Doe"
                  required
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                  placeholder="jane.doe@example.com"
                  required
                />
              </div>

              {/* Primary Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Phone *</label>
                <input
                  type="tel"
                  name="primary_phone"
                  value={formValues.primary_phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergency_contact"
                  value={formValues.emergency_contact}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formValues.dob}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender *</label>
                <select
                  name="gender"
                  value={formValues.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Parent Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Name</label>
                <input
                  type="text"
                  name="parent_name"
                  value={formValues.parent_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* Additional Fields Requested */}
              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Complete Address</label>
                <textarea
                  name="complete_address"
                  value={formValues.complete_address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all resize-none"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formValues.city}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formValues.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* State Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">State Code</label>
                <input
                  type="text"
                  name="state_code"
                  value={formValues.state_code}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* Desired Course */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Desired Course *</label>
                <select
                  name="course"
                  value={formValues.course}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                  required
                >
                  <option value="">Select a course</option>
                  <option value="Guitar">Guitar</option>
                  <option value="Keyboard">Keyboard</option>
                  <option value="Drums">Drums</option>
                  <option value="Vocals">Vocals</option>
                  <option value="Violin">Violin</option>
                </select>
              </div>

              {/* Class Frequency */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Frequency</label>
                <select
                  name="class_frequency"
                  value={formValues.class_frequency}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                >
                  <option value="">Select Frequency</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {/* Center */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Center *</label>
                <select
                  name="center"
                  value={formValues.center}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
                <input
                  type="text"
                  name="blood_group"
                  value={formValues.blood_group}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* Allergies */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formValues.allergies}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                />
              </div>

              {/* Preferred Contact Mode */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Mode of Contact</label>
                <select
                  name="contact_mode"
                  value={formValues.contact_mode}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
                >
                  <option value="">Select Mode</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              {/* Referrer */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">How did you hear about us?</label>
                <select
                  name="referrer"
                  value={formValues.referrer}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all"
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
              <div className="md:col-span-2 pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="acknowledgement"
                    checked={formValues.acknowledgement}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-[#463a7a] focus:ring-[#463a7a]"
                    id="ack"
                  />
                  <label htmlFor="ack" className="ml-2 text-sm text-gray-700 select-none">
                    I acknowledge the information provided is correct
                  </label>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-[#463a7a] text-white font-medium hover:bg-[#382e61] transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>{initialData ? 'Update Student' : 'Add Student'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
