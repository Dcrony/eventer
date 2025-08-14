import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyTickets from "./pages/MyTickets";
import CreateEvent from "./pages/CreateEvent";
import Dashboard from "./pages/Dashboard";
import EditEvent from "./pages/Editevent";
import MyEvents from "./pages/MyEvents";
import NavBar from "./components/NavBar";
import Success from "./pages/success";
import StatsDashboard from "./pages/StatsDashboard";
import Sidebar from "./components/SideBar";
import LiveEvent from "./components/LiveEvents";
import Settings from "./components/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<StatsDashboard />} />
        <Route path="/edit/:eventId" element={<EditEvent />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin/my-events" element={<MyEvents />} />
        <Route path="/live/events" element={<LiveEvent />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
