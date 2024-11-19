import { create } from "zustand";

const useInterviews = create((set) => ({
  interviews: {
    upcoming: [],
    past: []
  },
  isLoading: false,
  error: null,

  setInterviews: (interviews) => set({ interviews }),
  
  fetchInterviews: async () => {
    set({ isLoading: true });
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/interviews");
      const data = await response.json();
      
      const now = new Date();
      const sortedInterviews = data.reduce((acc, interview) => {
        const interviewDate = new Date(interview.dateTime);
        if (interviewDate > now) {
          acc.upcoming.push(interview);
        } else {
          acc.past.push(interview);
        }
        return acc;
      }, { upcoming: [], past: [] });

      // Sort upcoming interviews by date (earliest first)
      sortedInterviews.upcoming.sort((a, b) => 
        new Date(a.dateTime) - new Date(b.dateTime)
      );
      
      // Sort past interviews by date (most recent first)
      sortedInterviews.past.sort((a, b) => 
        new Date(b.dateTime) - new Date(a.dateTime)
      );

      set({ interviews: sortedInterviews, isLoading: false, error: null });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addInterview: async (interviewData) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(interviewData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add interview");
      }

      // Refresh interviews after adding
      useInterviews.getState().fetchInterviews();
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateInterview: async (id, updateData) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/interviews/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update interview");
      }

      // Refresh interviews after updating
      useInterviews.getState().fetchInterviews();
    } catch (error) {
      set({ error: error.message });
    }
  },
}));

export default useInterviews;
