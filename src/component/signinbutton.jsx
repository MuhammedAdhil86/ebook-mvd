import React, { useEffect } from "react";

const SignInButton = ({ onAuthSuccess }) => {
  useEffect(() => {
    // Attach callback
    window.phoneEmailListener = function (userObj) {
      console.log("✅ Phone.email callback:", userObj);
      onAuthSuccess(userObj);
    };

    // Load script once
    if (!document.getElementById("phone-email-script")) {
      const script = document.createElement("script");
      script.id = "phone-email-script";
      script.src = "https://www.phone.email/sign_in_button_v1.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.phoneEmailListener = null;
    };
  }, [onAuthSuccess]);

  return (
    <div
      className="pe_signin_button"
      data-client-id="18658709240224958364"
    ></div>
  );
};

export default SignInButton;
