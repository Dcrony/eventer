import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyTickets from "./pages/MyTickets";
import Dashboard from "./pages/Dashboard";
import Success from "./pages/Success";
import StatsDashboard from "./pages/StatsDashboard";
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
import UserManagement from "./pages/Admin";
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
import LandingPage from "./pages/landingpage";
import Pricing from "./pages/pricing";
import { useEffect, useState } from "react";

function Layout() {
  const location = useLocation();

  // hide navbar & sidebar on landing page and form pages
  const hideNavAndSidebar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {!hideNavAndSidebar && (isMobile ? <MobileBottomNav /> : <Sidebar />)}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <StatsDashboard />
            </AdminRoute>
          }
        />
        <Route path="/Eventdetail/:eventId" element={<EventDetail />} />
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
          path="/profile/:id"
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
          path="/scanner"
          element={
            <ProtectedRoute>
              <TicketScanner />
            </ProtectedRoute>
          }
        />
        <Route path="/validate/:ticketId" element={<TicketValidationPage />} />

        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/donate" element={<Donation />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
