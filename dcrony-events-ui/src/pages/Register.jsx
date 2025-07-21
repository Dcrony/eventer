import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./CSS/login.css";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    isOrganizer: false,
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", form);
      setSuccess("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Registration failed");
    }
    
  };

  return (
    <div className="login">
      <div className="form">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="error-message">{error}</div>
          <div className="success-message">{success}</div>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
          />
          <input
            name="email"
            placeholder="Email"
            type="email"
            onChange={handleChange}
            required
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            onChange={handleChange}
            required
          />
          <label>
            <span>
              <input
                type="checkbox"
                name="isOrganizer"
                onChange={handleChange}
              />
            </span>
            <span>I'm an Organizer</span>
          </label>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}
