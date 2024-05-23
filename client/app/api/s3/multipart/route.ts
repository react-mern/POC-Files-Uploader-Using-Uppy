import { getS3Client } from "@/data/getS3Client";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const client = getS3Client();
  const data = await req.json();
  const { type, metadata, filename } = data;

  if (typeof filename !== "string") {
    return NextResponse.json({
      status: 500,
      statusText: "s3: content filename must be a string",
    });
  }
  if (typeof type !== "string") {
    return NextResponse.json({
      status: 500,
      statusText: "s3: content type must be a string",
    });
  }

  const Key = `${crypto.randomUUID()}-${filename}`;

  const params = {
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key,
    ContentType: type,
    Metadata: metadata,
  };

  const command = new CreateMultipartUploadCommand(params);
  try {
    const data = await client.send(command);

    return NextResponse.json(
      { key: data?.Key, uploadId: data?.UploadId },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
  }
}
