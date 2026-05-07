import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect, useState } from "react";
import SEO from "./components/SEO";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import OrganizerStaffRoute from "./components/OrganizerStaffRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/toast";
import { SocketProvider } from "./hooks/useSocket";
import { NotificationsProvider } from "./hooks/useNotifications";
import { CreateEventProvider } from "./context/CreateEventContext";
import { getCurrentUser } from "./utils/auth";
import { getTrialDaysRemaining, isTrialEndingSoon } from "./utils/planAccess";
import TickiAIChat from ./components/TickiAIChat""

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

// Lazy load all page components
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Success = lazy(() => import("./pages/Success"));
const Sidebar = lazy(() => import("./components/SideBar"));
const MobileBottomNav = lazy(() => import("./components/MobileBottomNav"));
const LiveEvent = lazy(() => import("./components/LiveEvents"));
const Settings = lazy(() => import("./components/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const EventDetail = lazy(() => import("./pages/EventDetails"));
const Checkout = lazy(() => import("./pages/CheckOut"));
const TicketScanner = lazy(() => import("./pages/TicketScanner"));
const TicketValidationPage = lazy(() => import("./pages/ValidateTicket"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const LiveStream = lazy(() => import("./pages/LiveStream"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const Donation = lazy(() => import("./pages/Donation"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Documentation = lazy(() => import("./pages/Documentation"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const LandingPage = lazy(() => import("./pages/LandingPageV2"));
const Pricing = lazy(() => import("./pages/pricing"));
const AdminWithdrwal = lazy(() => import("./pages/AdminWithdrawals"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Notifications = lazy(() => import("./components/NotificationsPage"));
const Messages = lazy(() => import("./pages/Messages"));
const VerifyEmailOtp = lazy(() => import("./pages/VerifyEmailOtp"));
const TopNav = lazy(() => import("./components/TopNav"));
const EventAnalytics = lazy(() => import("./pages/EventAnalytics"));
const PlatformAnalytics = lazy(() => import("./pages/PlatformAnalytics"));
const Earnings = lazy(() => import("./pages/Earnings"));
const FeaturesPage = lazy(() => import("./pages/Features"));
const Favorites = lazy(() => import("./pages/Favorites"));
const UpgradeExperienceModal = lazy(() => import("./components/UpgradeExperienceModal"));
const FounderProfile = lazy(() => import("./pages/FounderProfile"));
const Billing = lazy(() => import("./pages/Billing"));
const DiscoverCreators = lazy(() => import("./pages/DiscoverCreators"));
const FAQ = lazy(() => import("./pages/FAQ"));

// Layout component with route definitions
function Layout() {
  const location = useLocation();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const { user } = useAuth();

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
      setUpgradeFeature("event limits");
      setUpgradeOpen(true);
    };

    const onUpgradeRequired = (event) => {
      setUpgradeFeature(event.detail?.featureName || "premium features");
      setUpgradeOpen(true);
    };

    window.addEventListener("userLogin", onLogin);
    window.addEventListener("planLimitHit", onLimit);
    window.addEventListener("planUpgradeRequired", onUpgradeRequired);
    return () => {
      window.removeEventListener("userLogin", onLogin);
      window.removeEventListener("planLimitHit", onLimit);
      window.removeEventListener("planUpgradeRequired", onUpgradeRequired);
    };
  }, []);

  const showTrialBanner = isTrialEndingSoon(user);
  const trialDaysRemaining = getTrialDaysRemaining(user);

  // Lazy load sidebar and navigation components only when needed
  const renderSidebar = () => {
    if (hideNavAndSidebar) return null;

    if (isMobile) {
      return (
        <>
          <Suspense fallback={null}>
            <TopNav />
            <MobileBottomNav />
          </Suspense>
        </>
      );
    }

    return (
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO />

      {renderSidebar()}

      <main className={`app-main ${!hideNavAndSidebar && !isMobile ? 'sidebar-padded' : ''} ${!hideNavAndSidebar && isMobile ? 'mobile-padded' : ''}`}>
        {showTrialBanner ? (
          <div className="trial-banner">
            Your free trial ends in {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"}.
            <a href="/pricing"> Upgrade to Pro</a> to keep TickiAI, analytics, and streaming active.
          </div>
        ) : null}

        <CreateEventProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-otp" element={<VerifyEmailOtp />} />

              {/* Static Pages */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/donation" element={<Donation />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/founder" element={<FounderProfile />} />
              <Route path="/discover/creators" element={<DiscoverCreators />} />
              <Route path="/user/:username" element={<Profile />} />

<Route path="/ticki-ai" element={<TickiAIChat />} />


              {/* Protected Routes */}
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
                path="/billing"
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </CreateEventProvider>
      </main>

      <Suspense fallback={null}>
        <UpgradeExperienceModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          featureName={upgradeFeature}
        />
      </Suspense>
    </div>
  );
}

// Main App component with providers
export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}