import { Link, Navigate, useLocation } from 'react-router-dom';
import { can, getStoredUser, homePathFor } from '../../utils/auth';

function AccessDenied() {
  return (
    <main className="access-denied">
      <div className="access-denied__card">
        <h1>Access denied</h1>
        <p>You don&apos;t have permission to view this section. Ask an administrator if you need access.</p>
        <Link to={homePathFor()} className="access-denied__link">Go back</Link>
      </div>
    </main>
  );
}

// Wrap a route with `module="invoices"` to require view permission on that
// module; without the prop it only requires a logged-in user.
export default function PrivateRoute({ children, module }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (module && !can(module, 'view')) {
    return <AccessDenied />;
  }

  return children;
}
