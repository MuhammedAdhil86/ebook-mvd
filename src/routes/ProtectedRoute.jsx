import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useBookStore } from "../store/useBookStore";
import Loader from "../component/loader";

export default function ProtectedRoute({
  children,
  redirectIfNotAuth = true,
  redirectToIfUnauthenticated = null,
}) {
  const { isAuthenticated, user } = useBookStore();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(check);
  }, []);

  if (loading) return <Loader />;

  // 1. Handle Unauthenticated Users
  if (!isAuthenticated) {
    const redirectPath =
      redirectToIfUnauthenticated || (redirectIfNotAuth ? "/verse" : "/");
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  const hasSubscription = user?.has_subscription;
  const type = user?.subscription_type?.toLowerCase();

  const currentPath = location.pathname;
  const isRenewPage = currentPath === "/renew";
  const isSubscriptionPage = currentPath === "/subscription";

  // 2. Handle Expired Subscription
  if (hasSubscription === false && type === "expired" && !isRenewPage) {
    return <Navigate to="/renew" replace />;
  }

  // 3. Handle NO Subscription (Redirect to /subscription)
  // This triggers if has_subscription is false and they aren't on the subscription/renew/etc pages
  if (!hasSubscription && !isSubscriptionPage && !isRenewPage) {
    return <Navigate to="/subscription" replace />;
  }

  // 4. Handle Active Subscription/Trial Logic
  // (Optional: Add specific logic if you need to restrict paid-only pages)

  return children;
}
