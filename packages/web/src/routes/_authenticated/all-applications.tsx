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

import { Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Button } from "@/components/ui/button";

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
  const qc = useQueryClient();

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

  async function deleteJobApplication(id: number) {
    const token = await getToken();
    if (!token) {
      throw new Error("No token found");
    }
    const res = await fetch(
      import.meta.env.VITE_APP_API_URL + "/applications/" + id,
      {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      }
    );
    if (!res.ok) {
      throw new Error("Something went wrong");
    }
  }

  const {
    mutate: deleteJob,
    isPending: isDeletingJob,
    error: deleteApplicationError,
  } = useMutation({
    mutationFn: deleteJobApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["getAllApplications"] });
    },
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
              <TableHead className="w-[150px]">Title</TableHead>
              <TableHead>Company</TableHead>

              <TableHead className="text-center">Job Posting</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="flex justify-center">
                    {application.imageUrl && (
                      <Link
                        to={application.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img className="max-w-60" src={application.imageUrl} />
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {deleteApplicationError ? (
                        <span className="text-red-500">
                          {deleteApplicationError.message}
                        </span>
                      ) : (
                        <Button
                          className="p-0 bg-transparent hover:bg-transparent"
                          onClick={() => deleteJob(application.id)}
                          disabled={isDeletingJob}
                        >
                          <Trash2 className="cursor-pointer text-red-500" />
                        </Button>
                      )}
                    </div>
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
