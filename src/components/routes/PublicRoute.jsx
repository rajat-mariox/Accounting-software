import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/auth';

export default function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const user = getStoredUser();

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
