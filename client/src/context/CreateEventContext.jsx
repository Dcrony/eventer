import React, { createContext, useContext, useState } from "react";
import CreateEvent from "../pages/CreateEvent";   // or wherever your component is

const CreateEventContext = createContext();

export const CreateEventProvider = ({ children }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const openCreateEvent = () => setIsCreateModalOpen(true);
  const closeCreateEvent = () => setIsCreateModalOpen(false);

  return (
    <CreateEventContext.Provider value={{ openCreateEvent, closeCreateEvent }}>
      {children}

      {/* Global Modal */}
      <CreateEvent
        isOpen={isCreateModalOpen}
        onClose={closeCreateEvent}
      />
    </CreateEventContext.Provider>
  );
};

export const useCreateEvent = () => {
  const context = useContext(CreateEventContext);
  if (!context) {
    throw new Error("useCreateEvent must be used within CreateEventProvider");
  }
  return context;
};