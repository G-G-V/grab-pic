import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import OrganizerLayout from "./layouts/OrganizerLayout";
import OrganizerDashboard from "./pages/organizer/Dashboard";
import MyEvents from "./pages/organizer/MyEvents";
import EventDetail from "./pages/organizer/EventDetail";
import Analytics from "./pages/organizer/Analytics";
import OrganizerSettings from "./pages/organizer/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/attendee" element={<AttendeeDashboard />} />
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<OrganizerDashboard />} />
            <Route path="events" element={<MyEvents />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<OrganizerSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
