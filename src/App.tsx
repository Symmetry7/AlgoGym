import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import Statistics from "./pages/Statistics";
import TrainingGym from "./pages/TrainingGym";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import HandleModal from "./components/HandleModal";
import usePersistentState from "./hooks/usePersistentState";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function AppRoutes() {
  const [cfHandle] = usePersistentState<string>("cfHandle", "");
  const [lcHandle] = usePersistentState<string>("lcHandle", "");
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/" && !cfHandle && !lcHandle) {
      setModalOpen(true);
    }
  }, [cfHandle, lcHandle, location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index onOpenHandleModal={() => setModalOpen(true)} />} />
        <Route path="/statistics" element={<Statistics onOpenHandleModal={() => setModalOpen(true)} />} />
        <Route path="/training" element={<TrainingGym onOpenHandleModal={() => setModalOpen(true)} />} />
        <Route path="/profile" element={<Profile onOpenHandleModal={() => setModalOpen(true)} />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <HandleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Toaster />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Router><AppRoutes /></Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
