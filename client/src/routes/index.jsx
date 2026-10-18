import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

export const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};
