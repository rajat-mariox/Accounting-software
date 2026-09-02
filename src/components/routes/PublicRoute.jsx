import { Navigate } from 'react-router-dom';
import { getStoredUser, homePathFor } from '../../utils/auth';

export default function PublicRoute({ children, redirectTo }) {
  const user = getStoredUser();

  if (user) {
    return <Navigate to={redirectTo ?? homePathFor(user)} replace />;
  }

  return children;
}
