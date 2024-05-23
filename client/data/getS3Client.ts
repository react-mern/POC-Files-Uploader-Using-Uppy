import { S3Client } from "@aws-sdk/client-s3";

export function getS3Client() {
  const s3Client = new S3Client({
    region: process.env.COMPANION_AWS_REGION!,
    credentials: {
      accessKeyId: process.env.COMPANION_AWS_KEY!,
      secretAccessKey: process.env.COMPANION_AWS_SECRET!,
    },
  });
  return s3Client;
}
