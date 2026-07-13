import React from "react";
import { useNavigate } from "react-router-dom";
import { useBookStore } from "../store/useBookStore";
import { useNotificationStore } from "../store/useToastStore";
import SignInButton from "../component/signinbutton";

export default function Login() {
  const verifyAccess = useBookStore((s) => s.verifyAccess);
  const setNotification = useNotificationStore((s) => s.setNotification);
  const navigate = useNavigate();

  const handleAuthSuccess = async (userObj) => {
    console.log("📦 OTP SUCCESS DATA:", userObj);

    let mobile = "";

    try {
      // CASE 1: Direct mobile
      if (userObj?.user_mobile_number) {
        mobile = userObj.user_mobile_number;
      }
      // CASE 2: Fetch from URL
      else if (userObj?.user_json_url) {
        console.log("🌐 Fetching user data...");
        const res = await fetch(userObj.user_json_url);
        const data = await res.json();
        console.log("📦 FULL FETCHED DATA:", data);
        mobile =
          data?.user_mobile_number ||
          data?.user_phone_number ||
          data?.mobile ||
          data?.phone ||
          "";
      }

      if (!mobile) {
        setNotification("Mobile not received from provider.", "error");
        return;
      }

      // Final Cleanup
      const digits = mobile.replace(/\D/g, "");
      const cleanNumber = digits.slice(-10);

      console.log("🚀 Sending to API:", cleanNumber);

      // Call API
      const result = await verifyAccess(cleanNumber);

      // --- ADDED DEBUGGING LOGS ---
      console.log("📡 FULL API Response:", result);
      if (result) {
        // Replace 'token' with the actual field name from your API response (e.g., accessToken, jwt)
        console.log(
          "🔑 Extracted Token:",
          result.token || "Token not found in response",
        );
      }
      // ----------------------------

      if (result.success) {
        setNotification(result.message, "success");
        navigate("/library");
      } else {
        setNotification(result.error || "Login failed.", "error");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setNotification("Login failed.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="w-full max-w-sm p-8 bg-white shadow-xl rounded-2xl text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm">
            Verify your mobile to continue
          </p>
        </div>

        <div className="flex justify-center py-4">
          <SignInButton onAuthSuccess={handleAuthSuccess} />
        </div>

        <p className="text-xs text-gray-400">
          Secure verification powered by Phone.email
        </p>
      </div>
    </div>
  );
}
