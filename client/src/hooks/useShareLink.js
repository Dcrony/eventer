import { useCallback } from "react";
import { useToast } from "../components/ui/toast";

export default function useShareLink() {
  const toast = useToast();

  return useCallback(
    async ({ title, text, url, copiedMessage = "Link copied to clipboard" }) => {
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          toast.success("Shared successfully");
          return true;
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          // Silently handle native share failure
        } else {
          return false;
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        toast.success(copiedMessage);
        return true;
      } catch (error) {
        toast.error("Could not copy link");
        return false;
      }
    },
    [toast],
  );
}
