import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LoanForm from "./pages/LoanForm";
import Loans from "./pages/Loans";
import Profile from "./pages/Profile";
import Outsource from "./pages/Outsource";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/loan/new" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/loans" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/outsource" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
