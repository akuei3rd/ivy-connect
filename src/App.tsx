import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Queue from "./pages/Queue";
import Room from "./pages/Room";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import HiringSessions from "./pages/HiringSessions";
import HiringSessionDetail from "./pages/HiringSessionDetail";
import NotFound from "./pages/NotFound";
import Browse from "./pages/Browse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/hiring-sessions" element={<HiringSessions />} />
          <Route path="/hiring-sessions/:id" element={<HiringSessionDetail />} />
          <Route path="/browse" element={<Browse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
