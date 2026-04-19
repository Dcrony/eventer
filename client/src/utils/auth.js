// Centralized authentication utilities
export const logout = () => {
  const logoutButtons = document.querySelectorAll(".logout");
  logoutButtons.forEach((btn) => {
    btn.textContent = "Logging out...";
    btn.disabled = true;
  });

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("userLogout"));

  setTimeout(() => {
    window.location.href = "/login";
  }, 500);
};

export const login = (userData, token) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
  window.dispatchEvent(new CustomEvent("userLogin"));
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
