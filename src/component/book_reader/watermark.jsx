import React from "react";
import Cookies from "js-cookie";

export default function Watermark() {
  const userString = Cookies.get("user");
  const user = userString ? JSON.parse(userString) : null;
  const identifier = user?.email || user?.id || "Protected Content";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-[0.05] z-50 flex flex-wrap gap-20 p-10">
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className="text-2xl font-bold rotate-45 whitespace-nowrap text-gray-800"
        >
          {identifier}
        </div>
      ))}
    </div>
  );
}
