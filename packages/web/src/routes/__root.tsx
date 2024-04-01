import { Outlet, Link } from "@tanstack/react-router";

import { type QueryClient } from "@tanstack/react-query";

import { createRootRouteWithContext } from "@tanstack/react-router";

import { NotFound } from "@/components/not-found";

import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  const { isAuthenticated } = useKindeAuth();
  return (
    <>
      <div className="py-2 flex max-w-2xl mx-auto justify-between items-center ">
        <Link to="/" className="text-2xl">
          Job Application Tracker
        </Link>
        <div className="flex gap-x-4">
          {" "}
          <Link
            to="/all-applications"
            className="[&.active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            All Applications
          </Link>{" "}
          <Link
            to="/new-application"
            className="[&.active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            New Application
          </Link>
          {isAuthenticated && (
            <Link
              to="/profile"
              className="[&.active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
      <hr />
      <div className="bg-background text-foreground flex flex-col m-10 gap-y-10 max-w-2xl mx-auto">
        <Outlet />
      </div>
    </>
  );
}
