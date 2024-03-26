import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./modules/Dashboard";
import Form from "./modules/Form";

const ProtectedRoute = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") !== null || false; // Ganti ini dengan logika otentikasi yang sesuai

  if (!isLoggedIn && auth) {
    console.log("Redirecting to /login");
    return <Navigate to="/login" />;
  } else if (
    isLoggedIn &&
    ["/login", "/signup"].includes(window.location.pathname)
  ) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute auth={true}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <ProtectedRoute>
            <Form isSignedIn={true} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <ProtectedRoute>
            <Form isSignedIn={false} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
