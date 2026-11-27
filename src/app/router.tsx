import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/app-shell';
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SignInPage,
  SignUpPage,
} from '@/features/auth/pages';
import { CatalogsPage } from '@/features/catalogs/catalogs-page';
import { KitchenPage } from '@/features/catalogs/kitchen-page';
import { HelpPage } from '@/features/help/help-page';
import { HomePage } from '@/features/home/home-page';
import { HouseholdDetailPage } from '@/features/households/household-detail-page';
import { HouseholdsPage } from '@/features/households/households-page';
import { InvitePage } from '@/features/households/invite-page';
import { OnboardingPage } from '@/features/households/onboarding-page';
import { EditProfilePage } from '@/features/profile/edit-profile-page';
import { InstallPage } from '@/features/profile/install-page';
import { PreferencesPage } from '@/features/profile/preferences-page';
import { RecipeDetailPage } from '@/features/recipes/recipe-detail-page';
import { RecipeFormPage } from '@/features/recipes/recipe-form-page';
import { RecipesPage } from '@/features/recipes/recipes-page';
import { PrivacyPage } from '@/features/profile/privacy-page';
import { ProfilePage } from '@/features/profile/profile-page';
import { NotFoundScreen } from './error-screen';
import { GuestOnly, RequireAuth, RequireHousehold } from './guards';
import { RouteToasts } from './route-toasts';

export const router = createBrowserRouter([
  {
    element: <RouteToasts />,
    errorElement: <NotFoundScreen />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <SignInPage /> },
          { path: '/signup', element: <SignUpPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/invite/:token', element: <InvitePage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/welcome', element: <OnboardingPage /> },
          {
            element: <RequireHousehold />,
            children: [
              {
                element: <AppShell />,
                children: [
                  { index: true, path: '/', element: <HomePage /> },
                  { path: '/recipes', element: <RecipesPage /> },
                  { path: '/recipes/new', element: <RecipeFormPage /> },
                  { path: '/recipes/catalogs', element: <CatalogsPage /> },
                  { path: '/kitchen', element: <KitchenPage /> },
                  { path: '/recipes/:recipeId', element: <RecipeDetailPage /> },
                  { path: '/recipes/:recipeId/edit', element: <RecipeFormPage /> },
                  { path: '/profile', element: <ProfilePage /> },
                  { path: '/profile/edit', element: <EditProfilePage /> },
                  { path: '/profile/preferences', element: <PreferencesPage /> },
                  { path: '/profile/install', element: <InstallPage /> },
                  { path: '/profile/privacy', element: <PrivacyPage /> },
                  { path: '/help', element: <HelpPage /> },
                  { path: '/households', element: <HouseholdsPage /> },
                  { path: '/households/:householdId', element: <HouseholdDetailPage /> },
                  { path: '*', element: <NotFoundScreen /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
