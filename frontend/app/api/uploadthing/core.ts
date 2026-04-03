import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  meetingMediaUploader: f({
    audio: {
      maxFileSize: "2GB",
      maxFileCount: 1,
    },
    video: {
      maxFileSize: "2GB",
      maxFileCount: 1,
    },
  }).middleware(async () => {
    return {}
  }).onUploadComplete(async ({ file }) => {
    return {
      fileUrl: file.ufsUrl,
      fileName: file.name,
      fileType: file.type,
    }
  }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
