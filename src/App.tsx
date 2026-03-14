import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "./pages/NotFound.tsx";

const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-syn-void">
    <div className="text-sm font-ui text-syn-text-muted animate-pulse">Loading Synapse...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/workspace/demo" replace />} />
            <Route path="/workspace/:id" element={<WorkspacePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
