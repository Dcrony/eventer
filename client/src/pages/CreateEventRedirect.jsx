import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEvent } from "../context/CreateEventContext";
import PageLoader from "../components/PageLoader";

export default function CreateEventRedirect() {
  const navigate = useNavigate();
  const { openCreateEvent } = useCreateEvent();

  useEffect(() => {
    openCreateEvent();
    navigate("/dashboard", { replace: true });
  }, [navigate, openCreateEvent]);

  return <PageLoader />;
}
