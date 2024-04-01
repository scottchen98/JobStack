import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { zodValidator } from "@tanstack/zod-form-adapter";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";

import { createFileRoute } from "@tanstack/react-router";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

export const Route = createFileRoute("/_authenticated/new-application")({
  component: NewApplicationPage,
});

type Application = {
  jobTitle: string;
  company: string;
  imageUrl?: string;
};

function NewApplicationPage() {
  const { getToken } = useKindeAuth();
  const navigate = useNavigate({ from: "/new-application" });

  const [filePreviewURL, setFilePreviewURL] = useState<string | undefined>();

  const computeSHA256 = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  };

  const mutation = useMutation({
    mutationFn: async ({
      data,
      image,
    }: {
      data: Application;
      image?: File;
    }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("No token found");
      }

      if (image) {
        const signedURLResponse = await fetch(
          import.meta.env.VITE_APP_API_URL + "/signed-url",
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contentType: image.type,
              contentLength: image.size,
              checksum: await computeSHA256(image),
            }),
          }
        );
        if (!signedURLResponse.ok) {
          throw new Error(
            "An error occurred while creating the job application."
          );
        }
        const { url } = (await signedURLResponse.json()) as { url: string };

        await fetch(url, {
          method: "PUT",
          body: image,
          headers: {
            "Content-Type": image.type,
          },
        });

        const imageUrl = url.split("?")[0];
        data.imageUrl = imageUrl;
      }

      const res = await fetch(
        import.meta.env.VITE_APP_API_URL + "/applications",
        {
          method: "POST",
          body: JSON.stringify({ application: data }),
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          "An error occurred while creating the job application."
        );
      }
      const json = await res.json();
      return json.application;
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      company: "",
      image: undefined as undefined | File,
    },
    onSubmit: async ({ value }) => {
      const data = {
        jobTitle: value.title,
        company: value.company,
      };
      await mutation.mutateAsync({ data, image: value.image });
      console.log("done");
      navigate({ to: "/all-applications" });
    },
    validatorAdapter: zodValidator,
  });

  return (
    <>
      <h1 className="text-2xl">New Application</h1>
      {mutation.isError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}
      <form.Provider>
        <form
          className="flex flex-col gap-y-10"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div>
            <form.Field
              name="title"
              children={(field) => (
                <Label>
                  Title
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors && (
                    <em role="alert">{field.state.meta.errors.join(", ")}</em>
                  )}
                </Label>
              )}
            />
          </div>
          <div>
            <form.Field
              name="company"
              children={(field) => (
                <Label>
                  Company
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors && (
                    <em role="alert">{field.state.meta.errors.join(", ")}</em>
                  )}
                </Label>
              )}
            />
          </div>
          <div>
            <form.Field
              name="image"
              children={(field) => (
                <Label>
                  Job Posting
                  {filePreviewURL && (
                    <img className="max-w-40 m-auto" src={filePreviewURL} />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (filePreviewURL) {
                        URL.revokeObjectURL(filePreviewURL);
                      }
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setFilePreviewURL(url);
                      } else {
                        setFilePreviewURL(undefined);
                      }
                      field.handleChange(file);
                    }}
                  />
                  {field.state.meta.errors && (
                    <em role="alert">{field.state.meta.errors.join(", ")}</em>
                  )}
                </Label>
              )}
            />
          </div>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "..." : "Submit"}
              </Button>
            )}
          ></form.Subscribe>
        </form>
      </form.Provider>
    </>
  );
}
