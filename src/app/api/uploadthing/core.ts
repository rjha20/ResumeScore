import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

/**
 * Resume file uploader router
 *
 * UploadThing v7 supported file types: image, video, audio, pdf, text, blob
 * We accept both "pdf" (native) and "blob" (for DOCX files).
 * Client-side validation handles .docx MIME type filtering.
 */
export const ourFileRouter = {
  resumeUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    blob: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Resume upload complete:", {
        userId: metadata.userId,
        fileName: file.name,
        fileUrl: file.ufsUrl,
      });
      return {
        uploadedBy: metadata.userId,
        fileName: file.name,
        fileUrl: file.ufsUrl,
        fileSize: file.size,
        fileType: file.type,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;