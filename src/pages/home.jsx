import React, { useEffect } from "react";
import { useBookStore } from "../store/useBookStore";

import Navbar from "../component/navbar";
import NewRelease from "../component/landingpage";
import FeaturedBooks from "../component/featuredbooks";
import AboutSection from "../component/about";
import PodcastSection from "../component/poadcast";
import TestimonialCarousel from "../component/testimonialCarousel";
import NewsletterSubscribe from "../component/newslatter";
import Footer from "../component/footer";

export default function Home() {
  const {
    user,
    fetchUserProfile,
    hasSubscription,
    subscriptionType,
    isExpired,
  } = useBookStore();

  // ✅ Fetch latest subscription info
  useEffect(() => {
    if (user?.ID) {
      fetchUserProfile(user.ID);
    }
  }, [user?.ID]);

  return (
    <div>
      <Navbar />

      {/* 🔴 EXPIRED TRIAL */}
      {user && isExpired && (
        <div style={alertStyle}>
          Your trial has expired. Please upgrade to continue reading.
        </div>
      )}

      {/* 🟡 NO SUBSCRIPTION */}
      {user && !hasSubscription && subscriptionType === "free" && (
        <div style={alertStyle}>
          You don’t have an active subscription. Start one to access content.
        </div>
      )}

      {/* 🟢 ACTIVE USERS → no banner */}

      <NewRelease />
      <FeaturedBooks />
      <AboutSection />
      <PodcastSection />
      <TestimonialCarousel />
      <NewsletterSubscribe />
      <Footer />
    </div>
  );
}

const alertStyle = {
  backgroundColor: "#ff4d4d",
  color: "white",
  textAlign: "center",
  padding: "10px",
  fontWeight: "bold",
};
