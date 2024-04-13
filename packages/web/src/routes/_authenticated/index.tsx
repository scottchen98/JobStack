import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { getToken } = useKindeAuth();
  async function getTotalApplications() {
    const token = await getToken();
    if (!token) {
      throw new Error("No token found");
    }
    const res = await fetch(
      import.meta.env.VITE_APP_API_URL + "/applications/total-applications",
      {
        headers: {
          Authorization: token,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Something went wrong");
    }
    return (await res.json()) as { total: number };
  }

  const { isPending, error, data } = useQuery({
    queryKey: ["getTotalApplications"],
    queryFn: getTotalApplications,
  });

  const totalJobApplications = data?.total ?? 0;

  return (
    <>
      <Card className="w-fit h-fit mx-auto border-primary mt-10">
        <CardHeader>
          <CardTitle className="text-xl">Total Job Applications:</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? "An error has occurred: " + error.message : null}
          <div className="text-2xl font-bold text-center">
            {isPending ? "..." : totalJobApplications}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
