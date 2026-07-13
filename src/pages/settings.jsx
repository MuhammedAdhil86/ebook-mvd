import React, { useState, useEffect } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { useBookStore } from "../store/useBookStore";
import toast from "react-hot-toast";
import Confirm from "../ui/conform";

export default function Settings() {
  const navigate = useNavigate();

  const { user, fetchUserProfile, logout, subscriptionType, isExpired } =
    useBookStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // 🔥 Fetch profile
  useEffect(() => {
    if (user?.ID) {
      fetchUserProfile(user.ID);
    }
  }, [user?.ID]);

  const sections = [
    {
      title: "Account & Preferences",
      items: [
        { label: "Language Preferences" },
        { label: "State Preferences" },
        { label: "Update Profile" },
        { label: "Logout", danger: true },
      ],
    },
    {
      title: "Library & Subscription",
      items: [{ label: "Delete my eBooks" }, { label: "Subscription" }],
    },
    {
      title: "Info & Policies",
      items: [
        { label: "Payment Policy" },
        { label: "Terms & Conditions" },
        { label: "Privacy Policy" },
        { label: "Disclaimer" },
        { label: "About Us", link: "/about" },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* 🔥 SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-md border-r">
        <div className="p-6 text-xl font-bold border-b">Account</div>

        <nav className="flex flex-col p-4 space-y-2">
          <div
            onClick={() => setActiveTab("profile")}
            className={`cursor-pointer px-3 py-2 rounded-md ${
              activeTab === "profile"
                ? "bg-yellow-100 text-yellow-700"
                : "text-gray-700 hover:text-yellow-600"
            }`}
          >
            Profile
          </div>

          <div
            onClick={() => setActiveTab("settings")}
            className={`cursor-pointer px-3 py-2 rounded-md ${
              activeTab === "settings"
                ? "bg-yellow-100 text-yellow-700"
                : "text-gray-700 hover:text-yellow-600"
            }`}
          >
            Settings
          </div>
        </nav>
      </aside>

      {/* 🔥 MAIN */}
      <main className="flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-2 p-4 border-b bg-white">
          <FiChevronLeft
            className="text-2xl cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-lg font-semibold ml-2">
            {activeTab === "profile" ? "Profile" : "Settings"}
          </h1>
        </div>

        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          {/* ================= PROFILE ================= */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Profile</h2>

              {!user ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow border space-y-6">
                  {/* 👤 Personal */}
                  <div>
                    <p>
                      <strong>Name:</strong> {user.first_name} {user.last_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Mobile:</strong> {user.mobile}
                    </p>
                    <p>
                      <strong>Job:</strong> {user.job_title}
                    </p>
                  </div>

                  {/* 📅 Account */}
                  <div>
                    <p>
                      <strong>Joined:</strong>{" "}
                      {new Date(user.date_of_join).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong> {user.status}
                    </p>
                  </div>

                  {/* 💳 Subscription */}
                  <div>
                    <p>
                      <strong>Type:</strong> {subscriptionType}
                    </p>

                    {user.subscription && (
                      <>
                        <p>
                          <strong>Start:</strong>{" "}
                          {new Date(
                            user.subscription.start_date,
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>End:</strong>{" "}
                          {new Date(
                            user.subscription.end_date,
                          ).toLocaleDateString()}
                        </p>
                      </>
                    )}

                    {isExpired && (
                      <p className="text-red-500">
                        Trial expired. Upgrade required.
                      </p>
                    )}
                  </div>

                  {/* 💰 Payment */}
                  {user.payment && (
                    <div>
                      <p>
                        <strong>Order ID:</strong> {user.payment.order_id}
                      </p>
                      <p>
                        <strong>Amount:</strong> ₹{user.payment.amount / 100}
                      </p>
                      <p>
                        <strong>Status:</strong> {user.payment.status}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= SETTINGS ================= */}
          {activeTab === "settings" && (
            <div className="space-y-10">
              {sections.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <h2 className="text-sm font-semibold text-yellow-700 uppercase">
                    {section.title}
                  </h2>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {section.items.map((item, i) =>
                      item.link ? (
                        <Link
                          key={i}
                          to={item.link}
                          className="px-4 py-3 border rounded-lg bg-white hover:bg-yellow-200"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <div
                          key={i}
                          onClick={
                            item.label === "Logout"
                              ? () => setShowConfirm(true)
                              : undefined
                          }
                          className={`px-4 py-3 border rounded-lg cursor-pointer ${
                            item.danger
                              ? "text-red-500 hover:bg-red-100"
                              : "hover:bg-yellow-200"
                          }`}
                        >
                          {item.label}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 🔥 CONFIRM MODAL */}
      <Confirm
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to logout?"
      />
    </div>
  );
}
