import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/auth-context';
import { FullPageSpinner } from '@/features/auth/pages';
import { takePendingInvitation } from '@/features/auth/pending-invitation';
import { ActiveHouseholdProvider } from '@/features/households/active-household';
import { useMyHouseholds } from '@/features/households/hooks';
import { useProfile, useSyncProfileLocale } from '@/features/profile/hooks';
import { ErrorScreen } from './error-screen';

export function GuestOnly() {
  const { session, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AuthedRoot />;
}

/** Loads the data every authenticated screen needs and applies the profile language. */
function AuthedRoot() {
  const profile = useProfile();
  const households = useMyHouseholds();
  useSyncProfileLocale(profile.data);

  if (profile.isPending || households.isPending) return <FullPageSpinner />;
  if (profile.isError || households.isError) {
    return (
      <ErrorScreen
        onRetry={() => {
          void profile.refetch();
          void households.refetch();
        }}
      />
    );
  }
  return (
    <ActiveHouseholdProvider households={households.data}>
      <Outlet />
    </ActiveHouseholdProvider>
  );
}

/** App sections require at least one household; otherwise the user goes through onboarding. */
export function RequireHousehold() {
  const households = useMyHouseholds();
  const location = useLocation();
  const pending = takePendingInvitation();
  if (pending) return <Navigate to={`/invite/${pending}`} replace />;
  if (!households.data?.length) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
