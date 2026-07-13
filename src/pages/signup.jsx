import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBookStore } from "../store/useBookStore";
import { useNotificationStore } from "../store/useToastStore";
import indianStates from "../data/indianstate";

const SignupPage = () => {
  // 1. Corrected: Using 'createReader' to match your Zustand store function
  const createReader = useBookStore((state) => state.createReader);
  const setNotification = useNotificationStore((s) => s.setNotification);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    jobTitle: "",
    stateId: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 2. Critical: Mapping frontend camelCase to API snake_case
    const apiPayload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      mobile: formData.mobile,
      job_title: formData.jobTitle,
      state_id: Number(formData.stateId), // API expects a number
      role: "reader", // Set as default per your Postman body
    };

    try {
      const result = await createReader(apiPayload);

      if (result.success) {
        setNotification("Account created successfully!", "success");
        // Redirect to login or home after a short delay
        setTimeout(() => navigate("/login"), 1500);
      } else {
        // Show the specific error message from the API
        setNotification(result.error || "Signup failed", "error");
      }
    } catch (err) {
      setNotification("A connection error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffbea] px-4">
      <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              required
              name="firstName"
              placeholder="First Name"
              className="w-1/2 border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-yellow-500"
              value={formData.firstName}
              onChange={handleChange}
            />
            <input
              required
              name="lastName"
              placeholder="Last Name"
              className="w-1/2 border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-yellow-500"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <input
            required
            name="email"
            type="email"
            placeholder="Email Address"
            className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-yellow-500"
            value={formData.email}
            onChange={handleChange}
          />

          <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white focus-within:border-yellow-500">
            <span className="text-gray-500 text-sm pr-2 border-r mr-2">
              +91
            </span>
            <input
              required
              name="mobile"
              type="tel"
              placeholder="Mobile Number"
              className="w-full outline-none text-sm"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>

          <input
            required
            name="jobTitle"
            placeholder="Job Title"
            className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-yellow-500"
            value={formData.jobTitle}
            onChange={handleChange}
          />

          <select
            required
            name="stateId"
            className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-yellow-500"
            value={formData.stateId}
            onChange={handleChange}
          >
            <option value="">Select State</option>
            {indianStates.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded font-medium transition text-white ${
              loading
                ? "bg-yellow-300 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {loading ? "Creating..." : "Signup"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
