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
import PrivateRoute from "./components/PrivateRoute";
import Success from "./pages/success";
import StatsDashboard from "./pages/StatsDashboard";
import Sidebar from "./components/SideBar";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Sidebar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreateEvent />
            </PrivateRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <PrivateRoute>
              <MyTickets />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit/:eventId"
          element={
            <PrivateRoute>
              <EditEvent />
            </PrivateRoute>
          }
        />
        <Route path="/success" element={<Success />} />
        <Route
          path="/admin/my-events"
          element={
            <PrivateRoute>
              <MyEvents />
            </PrivateRoute>
          }
        />
        </Routes>
    </BrowserRouter>
  );
}
