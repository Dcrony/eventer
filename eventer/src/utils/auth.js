// Centralized authentication utilities
export const logout = () => {
  // Show loading state
  const logoutButtons = document.querySelectorAll('.logout');
  logoutButtons.forEach(btn => {
    btn.textContent = '🔄 Logging out...';
    btn.disabled = true;
  });
  
  // Clear all auth data
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Dispatch logout event for other components
  window.dispatchEvent(new CustomEvent('userLogout'));
  
  // Small delay to show loading state
  setTimeout(() => {
    // Redirect to login page
    window.location.href = "/login";
  }, 500);
};

export const login = (userData, token) => {
  // Store auth data
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
  
  // Dispatch login event for other components
  window.dispatchEvent(new CustomEvent('userLogin'));
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
