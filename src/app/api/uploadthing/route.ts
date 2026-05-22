import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const { POST, GET } = createRouteHandler({
  router: ourFileRouter,
});
