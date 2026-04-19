import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import MyTickets from "./pages/MyTickets";
import Dashboard from "./pages/Dashboard";
import Success from "./pages/Success";
import Sidebar from "./components/SideBar";
import MobileBottomNav from "./components/MobileBottomNav";
import LiveEvent from "./components/LiveEvents";
import Settings from "./components/Settings";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import EventDetail from "./pages/EventDetails";
import Checkout from "./pages/CheckOut";
import TicketScanner from "./pages/TicketScanner";
import TicketValidationPage from "./pages/ValidateTicket";
import UserManagement from "./pages/UserManagement";
import LiveStream from "./pages/LiveStream";

import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Donation from "./pages/Donation";
import HelpCenter from "./pages/HelpCenter";
import Documentation from "./pages/Documentation";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import OrganizerStaffRoute from "./components/OrganizerStaffRoute";
import LandingPage from "./pages/landingpage";
import Pricing from "./pages/pricing";
import { useEffect, useState } from "react";
import AdminWithdrwal from "./pages/AdminWithdrawals";
import Transactions from "./pages/Transactions";
import Notifications from "./components/NotificationsPage";
import Messages from "./pages/Messages";
import VerifyEmailOtp from "./pages/VerifyEmailOtp";
import TopNav from "./components/TopNav";
import EventAnalytics from "./pages/EventAnalytics";
import PlatformAnalytics from "./pages/PlatformAnalytics";
import Earnings from "./pages/Earnings";
import { ToastProvider } from "./components/ui/toast";
import { SocketProvider } from "./hooks/useSocket";
import { NotificationsProvider } from "./hooks/useNotifications";
import FeaturesPage from "./pages/Features";
import Favorites from "./pages/Favorites";
import Community from "./pages/Community";
import UpgradeExperienceModal from "./components/UpgradeExperienceModal";
import API from "./api/axios";
import { getCurrentUser, login } from "./utils/auth";
import { useToast } from "./components/ui/toast";
import { AuthProvider } from "./context/AuthContext";
import FounderProfile from "./pages/FounderProfile";
import Billing from "./pages/Billing";
import DiscoverCreators from "./pages/DiscoverCreators";

function Layout() {
  const location = useLocation();
  const toast = useToast();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // hide navbar & sidebar on landing page and form pages
  const hideNavAndSidebar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/verify-email" ||
    location.pathname === "/verify-otp";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onLogin = () => {
      const user = getCurrentUser();
      const plan = String(user?.plan || "free").toLowerCase();
      if (!user || plan !== "free") return;
      if (sessionStorage.getItem("tickispot_upgrade_prompt_v1")) return;
      sessionStorage.setItem("tickispot_upgrade_prompt_v1", "1");
      setUpgradeOpen(true);
    };

    const onLimit = () => {
      setUpgradeOpen(true);
    };

    window.addEventListener("userLogin", onLogin);
    window.addEventListener("planLimitHit", onLimit);
    return () => {
      window.removeEventListener("userLogin", onLogin);
      window.removeEventListener("planLimitHit", onLimit);
    };
  }, []);

  const handleUpgradeToPro = async () => {
    try {
      const { data } = await API.patch("/users/me/plan", { plan: "pro" });
      const token = localStorage.getItem("token");
      const prev = getCurrentUser();
      if (prev && token) {
        login(
          {
            ...prev,
            plan: data.plan,
            eventCount: data.user?.eventCount ?? prev.eventCount,
          },
          token,
        );
      }
      toast.success("You’re on Pro — enjoy unlimited events and analytics.");
    } catch {
      toast.error("Could not complete upgrade. Try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>TickiSpot - Discover & Manage Events</title>
        <meta
          name="description"
          content="Created by Ibrahim Abdulmajeed, founder of TickiSpot"
        />
        <meta
          name="keywords"
          content="events, ticketing, Ibrahim Abdulmajeed, TickiSpot"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Person",
                name: "Ibrahim Abdulmajeed",
                jobTitle: "Founder",
                worksFor: { "@type": "Organization", name: "TickiSpot" },
                url: "https://dcrony.vercel.app",
              },
              {
                "@type": "Person",
                name: "OLarenwaju Oluwashinnayomi",
                jobTitle: "Co-Founder",
                worksFor: { "@type": "Organization", name: "TickiSpot" },
                url: "",
              },
              {
                "@type": "Organization",
                name: "TickiSpot",
                url: "https://tickispot.com" || "https://tickispot.vercel.app",
                founder: {
                  "@type": "Person",
                  name: "Ibrahim Abdulmajeed",
                },
                coFounder: {
                  "@type": "Person",
                  name: "OLarenwaju Oluwashinnayomi",
                },
                foundingDate: "2024-01-01",
                description:
                  "TickiSpot is an all-in-one event management and ticketing platform designed to empower creators and organizers. With features like customizable event pages, secure ticketing, real-time analytics, and seamless integrations, TickiSpot makes it easy to create, promote, and manage events of all sizes. Whether you're hosting a small workshop or a large conference, TickiSpot provides the tools you need to succeed.",
                logo: "https://tickispot.com/logo.png",
              },
            ],
          })}
        </script>
      </Helmet>
      {/* Show Sidebar on Desktop, MobileBottomNav and TopNav on Mobile */}
      {!hideNavAndSidebar && (
        <>
          {isMobile ? (
            <>
              <TopNav />
              <MobileBottomNav />
            </>
          ) : (
            <Sidebar />
          )}
        </>
      )}
      
      <main className={`app-main ${!hideNavAndSidebar && !isMobile ? 'sidebar-padded' : ''} ${!hideNavAndSidebar && isMobile ? 'mobile-padded' : ''}`}>

   
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyEmailOtp />} />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute>
                <MyTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/earnings"
            element={
              <OrganizerStaffRoute>
                <Earnings />
              </OrganizerStaffRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <AdminRoute>
                <AdminWithdrwal />
              </AdminRoute>
            }
          />
          <Route path="/admin/dashboard" element={<Navigate to="/analytics" replace />} />
          <Route path="/Eventdetail/:eventId" element={<EventDetail />} />
          <Route
            path="/events/:eventId/analytics"
            element={
              <ProtectedRoute>
                <EventAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <PlatformAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <Success />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live/events"
            element={
              <ProtectedRoute>
                <LiveEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live/:eventId"
            element={
              <ProtectedRoute>
                <LiveStream />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/me"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/checkout/:eventId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <OrganizerStaffRoute>
                <TicketScanner />
              </OrganizerStaffRoute>
            }
          />
          <Route
            path="/validate/:ticketId"
            element={
              <OrganizerStaffRoute>
                <TicketValidationPage />
              </OrganizerStaffRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/features" element={<FeaturesPage/>} />
          <Route path="/founder" element={<FounderProfile />} />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route path="/discover/creators" element={<DiscoverCreators />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/donate" element={<Donation />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </main>

      <UpgradeExperienceModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSelectPro={handleUpgradeToPro}
      />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <NotificationsProvider>
              <BrowserRouter>
                <Layout />
              </BrowserRouter>
            </NotificationsProvider>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
