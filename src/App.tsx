import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import Statistics from "./pages/Statistics";
import TrainingGym from "./pages/TrainingGym";
import NotFound from "./pages/NotFound";
import HandleModal from "./components/HandleModal";
import usePersistentState from "./hooks/usePersistentState";
import { useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  const [cfHandle] = usePersistentState<string>("cfHandle", "");
  const [lcHandle] = usePersistentState<string>("lcHandle", "");
  const [modalOpen, setModalOpen] = useState(false);

  // Show modal on first visit if no handle is set
  useEffect(() => {
    if (!cfHandle && !lcHandle) {
      setModalOpen(true);
    }
  }, [cfHandle, lcHandle]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index onOpenHandleModal={() => setModalOpen(true)} />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/training" element={<TrainingGym />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <HandleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
