import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./CSS/login.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setSuccess("Login successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      {setError("Login failed"), 1000};
    }
  };

  return (
    <div className="login">
      <div className="form">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
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
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
