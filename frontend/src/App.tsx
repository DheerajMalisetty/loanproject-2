import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LoanForm = lazy(() => import("./pages/LoanForm"));
const Loans = lazy(() => import("./pages/Loans"));
const Profile = lazy(() => import("./pages/Profile"));
const Outsource = lazy(() => import("./pages/Outsource"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'loan_officer', 'employee']}>
                    <Layout />
                  </RoleProtectedRoute>
                }
              />
              
              <Route 
                path="/loan/new" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'loan_officer', 'employee']}>
                    <Layout />
                  </RoleProtectedRoute>
                }
              />
              
              <Route 
                path="/loans" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'loan_officer']}>
                    <Layout />
                  </RoleProtectedRoute>
                }
              />
              
              <Route 
                path="/payments" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'loan_officer']}>
                    <Layout />
                  </RoleProtectedRoute>
                }
              />
              
              <Route 
                path="/outsource" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'loan_officer']}>
                    <Layout />
                  </RoleProtectedRoute>
                }
              />
              
              <Route 
                path="/profile" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'loan_officer', 'employee']}>
                    <Layout />
                  </RoleProtectedRoute>
                }
              />
              
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
