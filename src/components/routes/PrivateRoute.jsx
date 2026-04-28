import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../../utils/auth';

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
