import { useEffect } from "react";

const COLLAPSED = "5rem";
const EXPANDED = "15rem";

/**
 * Resets --sidebar-width when main sidebar is hidden (auth, landing, admin).
 * SideBar sets the variable when visible; this hook clears stale padding.
 */
export function useSidebarWidth(hideNavAndSidebar) {
  useEffect(() => {
    if (hideNavAndSidebar) {
      document.documentElement.style.setProperty("--sidebar-width", "0px");
    }
    return () => {
      if (hideNavAndSidebar) {
        document.documentElement.style.removeProperty("--sidebar-width");
      }
    };
  }, [hideNavAndSidebar]);
}

export { COLLAPSED, EXPANDED };
