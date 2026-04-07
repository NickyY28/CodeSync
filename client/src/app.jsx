import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Room from "./pages/Room";

// Protects routes — wraper component which guards routes
// children is a built in react prop, like here children of PrivateRoute are Home and Room components, react <Home/> ko automatically children naam de k usse parameter me function k paas bhej deta hai
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // wait for token check
  return user ? children : <Navigate to="/auth" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/room/:roomId" element={<PrivateRoute><Room /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}