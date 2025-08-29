import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateEvent from "./pages/CreateEvent";
import MyTickets from "./pages/MyTickets";
import Dashboard from "./pages/Dashboard";
import EditEvent from "./pages/Editevent";
import MyEvents from "./pages/MyEvents";
import NavBar from "./components/NavBar";
import Success from "./pages/success";
import StatsDashboard from "./pages/StatsDashboard";
import Sidebar from "./components/SideBar";
import LiveEvent from "./components/LiveEvents";
import Settings from "./components/Settings";
import Profile from "./pages/Profile";
import EventDetail from "./pages/EventDetails";
import Checkout from "./pages/CheckOut";
import TicketScanner from "./pages/TicketScanner";
import TicketValidationPage from "./pages/ValidateTicket";
import UserManagement from "./pages/admin";


function Layout() {
  const location = useLocation();

  // hide navbar & sidebar on landing page
  const hideNavAndSidebar = location.pathname === "/";

  return (
    <>
      {!hideNavAndSidebar && <NavBar />}
      {!hideNavAndSidebar && <Sidebar />}
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<StatsDashboard />} />
        <Route path="/Eventdetail/:eventId" element={<EventDetail />} />
        <Route path="/edit/:eventId" element={<EditEvent />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin/my-events" element={<MyEvents />} />
        <Route path="/live/events" element={<LiveEvent />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/admin" element={<UserManagement />} />
        <Route path="/checkout/:eventId" element={<Checkout />} />
        <Route path="/scanner" element={<TicketScanner />} />
        <Route path="/validate/:ticketId" element={<TicketValidationPage />} />
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
