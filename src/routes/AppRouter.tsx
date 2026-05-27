import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";

import GuestGuard from "./guards/GuestGuard";
import AuthGuard from "./guards/AuthGuard";
import AdminGuard from "./guards/AdminGuard";

import PublicDashboard from "@/pages/public/PublicDashboard";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import UserFeed from "@/pages/user/UserFeed";
import UserProfile from "@/pages/user/UserProfile";
import OAuth2RedirectHandler from "@/pages/auth/OAuth2RedirectHandler";
import OtherUserProfile from "@/pages/user/OtherUserProfile";
import ExplorePage from "@/pages/user/ExplorePage";
import CheckinHistoryPage from "@/pages/user/CheckinHistoryPage";
import CommentHistoryPage from "@/pages/user/CommentHistoryPage";
import PendingLocationsPage from "@/pages/user/PendingLocationPage";
import LocationManagePage from "@/pages/admin/LocationManagePage";
import ApprovalsPage from "@/pages/admin/ApprovalsPage";
import UserManagementPage from "@/pages/admin/UserManagePage";

const AppRouter = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: "/", element: <PublicDashboard /> }],
  },
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/oauth2/redirect", element: <OAuth2RedirectHandler /> },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/feed", element: <UserFeed /> },
          { path: "/profile", element: <UserProfile /> },
          { path: "/checkin-history", element: <CheckinHistoryPage /> },
          { path: "/profile/:userId", element: <OtherUserProfile /> },
          { path: "/explore", element: <ExplorePage /> },
          { path: "/review-history", element: <CommentHistoryPage /> },
          { path: "/pending-locations", element: <PendingLocationsPage /> },
        ],
      },
    ],
  },
  {
    element: <AdminGuard />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/admin/approvals",
            element: <ApprovalsPage />,
          },
          { path: "/admin/users", element: <UserManagementPage /> },
          { path: "/admin/locations", element: <LocationManagePage /> },
        ],
      },
    ],
  },
]);

export default AppRouter;
