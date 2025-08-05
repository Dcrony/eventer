import { Link} from "react-router-dom";
import "./Sidebar.css"
import PrivateRoute from "./PrivateRoute";

export default function Sidebar() {


  return (
    <div className="Sidebar">
      <div className="btn">
        <button>|||</button>
      </div>
          <div className="Sidebar-contents">      

            <Link to="/" 
            className="link">
              🎛 <span>Home</span>
            </Link>
            <Link
              to="/dashboard"
              className="link"
            >
              🎛 <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/dashboard"
              className="link"
            >
              📊 <span>Stats</span>
            </Link>
            <Link to="/tickets"
            className="link">
              🎫 <span>My Tickets</span>
            </Link>
      </div>
    </div>
  );
}
