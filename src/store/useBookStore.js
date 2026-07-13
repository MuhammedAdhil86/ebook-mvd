import { create } from "zustand";
import Cookies from "js-cookie";
import api from "../api/Instance";

export const useBookStore = create((set, get) => ({
  // =========================
  // UI STATE
  // =========================
  bookInfo: null,
  chapters: [],
  expandedChapter: null,
  selectedTopic: null,
  popupData: null,
  zoom: 100,
  isFullscreen: false,
  isLoading: false,
  error: null,

  // =========================
  // AUTH STATE (from cookies)
  // =========================
  token: Cookies.get("token") || null,
  user: Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null,
  isAuthenticated: !!Cookies.get("token"),
  subscriptionType: Cookies.get("subscription_type") || null,
  hasSubscription: Cookies.get("has_subscription") === "true",

  // =========================
  // SIGNUP
  // =========================
  createReader: async (readerData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/user/reader/create", readerData);

      set({ isLoading: false });

      return {
        success: true,
        message: response.data.message || "Account created successfully!",
      };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Server connection failed";

      set({ isLoading: false, error: errorMessage });

      return { success: false, error: errorMessage };
    }
  },

  fetchUserProfile: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/user/readers/getuserbyid/${userId}`);
      const { user_info, sub_info } = response.data;

      // Update State & Cookies
      const userData = user_info;
      const subType = sub_info?.subscription_type || "free";
      const hasSub = !!sub_info?.has_subscription;

      Cookies.set("user", JSON.stringify(userData), { expires: 7 });
      Cookies.set("subscription_type", subType, { expires: 7 });
      Cookies.set("has_subscription", String(hasSub), { expires: 7 });

      set({
        user: userData,
        subscriptionType: subType,
        hasSubscription: hasSub,
        isLoading: false,
      });

      return { success: true, subInfo: sub_info };
    } catch (err) {
      set({ isLoading: false });
      return { success: false };
    }
  },

  // =========================
  // LOGIN (🔥 FIXED)
  // =========================
  verifyAccess: async (mobile) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post(
        "/user/reader/verifyaccess",
        { mobile }
      );

      console.log("📡 RAW API RESPONSE:", response.data);

      // ✅ FIX: correct destructuring
      const { token, user } = response.data;

      // ❌ Safety check
      if (!token || !user) {
        throw new Error("Invalid API response structure");
      }

      // =========================
      // SAVE TO COOKIES
      // =========================
      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user", JSON.stringify(user), { expires: 7 });
      Cookies.set("subscription_type", user.subscription_type || "free", { expires: 7 });
      Cookies.set("has_subscription", String(!!user.has_subscription), { expires: 7 });

      // =========================
      // UPDATE STATE
      // =========================
      set({
        token,
        user,
        isAuthenticated: true,
        subscriptionType: user.subscription_type || "free",
        hasSubscription: !!user.has_subscription,
        isLoading: false,
      });

      return {
        success: true,
        message: "Login successful!",
        data: response.data,
      };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "You do not have access to this portal.";

      console.error("❌ verifyAccess error:", errorMessage);

      set({ isLoading: false, error: errorMessage });

      return { success: false, error: errorMessage };
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: () => {
    Cookies.remove("token");
    Cookies.remove("subscription_type");
    Cookies.remove("has_subscription");
    Cookies.remove("user");

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      subscriptionType: null,
      hasSubscription: false,
    });
  },

  // =========================
  // UPDATE SUBSCRIPTION
  // =========================
  updateSubscriptionState: (user) => {
    if (user) {
      Cookies.set("subscription_type", user.subscription_type, { expires: 7 });
      Cookies.set("has_subscription", String(user.has_subscription), { expires: 7 });
      Cookies.set("user", JSON.stringify(user), { expires: 7 });

      set({
        user,
        subscriptionType: user.subscription_type,
        hasSubscription: !!user.has_subscription,
      });
    }
  },

  // =========================
  // UI ACTIONS
  // =========================
  setBookInfo: (info) => set({ bookInfo: info }),
  setChapters: (chapters) => set({ chapters }),

  toggleChapter: (id) =>
    set((s) => ({
      expandedChapter: s.expandedChapter === id ? null : id,
    })),

  setSelectedTopic: (topic) =>
    set({ selectedTopic: topic, popupData: null }),

  setPopupData: (data) => set({ popupData: data }),

  setZoom: (zoom) => set({ zoom }),

  toggleFullscreen: () =>
    set((s) => ({ isFullscreen: !s.isFullscreen })),

  // =========================
  // HELPERS
  // =========================
  isSubscribed: () => {
    const state = get();

    return (
      state.isAuthenticated &&
      state.subscriptionType &&
      !["pending", "expired", "free"].includes(state.subscriptionType)
    );
  },

  getUser: () => get().user,
}));