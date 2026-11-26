import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useToast } from '@/components/ui/toast';

/** Shows a toast passed through navigation state (e.g. after resetting the password). */
export function RouteToasts() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const message = (location.state as { toast?: string } | null)?.toast;
  useEffect(() => {
    if (!message) return;
    toast.show(message);
    void navigate(location.pathname, { replace: true, state: null });
  }, [message, toast, navigate, location.pathname]);
  return <Outlet />;
}
