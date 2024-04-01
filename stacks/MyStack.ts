import { StackContext, Api, StaticSite, Bucket } from "sst/constructs";

export function API({ stack }: StackContext) {
  const audience = `api-JobApplicationApp-${stack.stage}`;

  const assetsBucket = new Bucket(stack, "assets");

  const api = new Api(stack, "api", {
    authorizers: {
      myAuthorizer: {
        type: "jwt",
        jwt: {
          issuer: "https://jobapplicationapp.kinde.com",
          audience: [audience],
        },
      },
    },
    defaults: {
      authorizer: "myAuthorizer",
      function: {
        environment: {
          DRIZZLE_DATABASE_URL: process.env.DRIZZLE_DATABASE_URL!,
        },
      },
    },
    routes: {
      "GET /": {
        authorizer: "none",
        function: {
          handler: "packages/functions/src/lambda.handler",
        },
      },
      "GET /applications/total-applications":
        "packages/functions/src/applications.handler",
      "GET /applications": "packages/functions/src/applications.handler",
      "POST /applications": "packages/functions/src/applications.handler",
      "POST /signed-url": {
        function: {
          environment: {
            ASSETS_BUCKET_NAME: assetsBucket.bucketName,
          },
          handler: "packages/functions/src/s3.handler",
        },
      },
      "DELETE /applications/{id}": {
        function: {
          environment: {
            ASSETS_BUCKET_NAME: assetsBucket.bucketName,
          },
          handler: "packages/functions/src/applications.handler",
        },
      },
    },
  });

  api.attachPermissionsToRoute("POST /signed-url", [assetsBucket, "grantPut"]);
  api.attachPermissionsToRoute("DELETE /applications/{id}", [
    assetsBucket,
    "grantDelete",
  ]);

  const web = new StaticSite(stack, "web", {
    path: "packages/web",
    buildOutput: "dist",
    buildCommand: "npm run build",
    environment: {
      VITE_APP_API_URL: api.url,
      VITE_APP_KINDE_AUDIENCE: audience,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    WebsiteURL: web.url,
  });
}
