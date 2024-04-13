import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";

import { createFileRoute } from "@tanstack/react-router";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

export const Route = createFileRoute("/_authenticated/all-applications")({
  component: AllApplications,
});

type Application = {
  id: number;
  jobTitle: string;
  company: number;
  imageUrl?: string;
};

function AllApplications() {
  const { getToken } = useKindeAuth();

  async function getAllApplications() {
    const token = await getToken();
    if (!token) {
      throw new Error("No token found");
    }
    const res = await fetch(
      import.meta.env.VITE_APP_API_URL + "/applications",
      {
        headers: {
          Authorization: token,
        },
      }
    );
    if (!res.ok) {
      throw new Error("Something went wrong");
    }
    return (await res.json()) as { applications: Application[] };
  }

  const { isPending, error, data } = useQuery({
    queryKey: ["getAllApplications"],
    queryFn: getAllApplications,
  });

  console.log(data);

  return (
    <div className="mt-28">
      {error ? (
        "An error has occurred: " + error.message
      ) : (
        <Table>
          <TableCaption>A list of your recent job applications.</TableCaption>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead className="w-[100px]">Title</TableHead>
              <TableHead>Company</TableHead>

              <TableHead className="text-right">Job Posting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell className="font-medium">
                  <Skeleton className="h-4 w-full"></Skeleton>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full"></Skeleton>
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-full"></Skeleton>
                </TableCell>
              </TableRow>
            ) : (
              data.applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.jobTitle}
                  </TableCell>
                  <TableCell>{application.company}</TableCell>
                  <TableCell className="flex justify-end">
                    {application.imageUrl && (
                      <img className="max-w-60" src={application.imageUrl} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
