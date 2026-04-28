import { Toaster } from 'react-hot-toast';
import Home from './pages/home/Home.jsx';
import Login from './pages/login/Login.jsx';
import Signup from './pages/signup/Signup.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

function App() {
  const { authUser } = useAuthContext();
  return (
    <div className="p-4 h-screen flex items-center justify-center">
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary>
              {authUser ? <Home /> : <Navigate to="/login" />}
            </ErrorBoundary>
          }
        />
        <Route
          path="/login"
          element={
            <ErrorBoundary>
              {authUser ? <Navigate to="/" /> : <Login />}
            </ErrorBoundary>
          }
        />
        <Route
          path="/signup"
          element={
            <ErrorBoundary>
              {authUser ? <Navigate to="/" /> : <Signup />}
            </ErrorBoundary>
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
