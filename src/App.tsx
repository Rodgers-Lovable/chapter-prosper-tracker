import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ChapterLeaderDashboard from "./pages/chapter-leader/ChapterLeaderDashboard";
import ChapterMembers from "./pages/chapter-leader/ChapterMembers";
import ChapterMetrics from "./pages/chapter-leader/ChapterMetrics";
import ChapterReports from "./pages/chapter-leader/ChapterReports";
import ChapterTrades from "./pages/chapter-leader/ChapterTrades";
import ChapterNotifications from "./pages/chapter-leader/ChapterNotifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chapter-leader" element={<ChapterLeaderDashboard />} />
            <Route path="/chapter-leader/members" element={<ChapterMembers />} />
            <Route path="/chapter-leader/metrics" element={<ChapterMetrics />} />
            <Route path="/chapter-leader/reports" element={<ChapterReports />} />
            <Route path="/chapter-leader/trades" element={<ChapterTrades />} />
            <Route path="/chapter-leader/notifications" element={<ChapterNotifications />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
