import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

export function Login() {
  const { login, register } = useKindeAuth();
  return (
    <div className="flex flex-col items-center justify-center h-dvh">
      <h1 className="text-5xl font-bold mb-2 tracking-wide">
        Welcome to JobStack
      </h1>
      <p className="text-xl">Your organized path to landing your dream job.</p>
      <div className="mt-8 flex gap-x-4">
        <Button onClick={() => login()}>Login</Button>
        <Button onClick={() => register()}>Register</Button>
      </div>
    </div>
  );
}

const Component = () => {
  const { isAuthenticated } = useKindeAuth();
  if (!isAuthenticated) {
    return <Login />;
  }
  return <Outlet />;
};

export const Route = createFileRoute("/_authenticated")({
  component: Component,
});
