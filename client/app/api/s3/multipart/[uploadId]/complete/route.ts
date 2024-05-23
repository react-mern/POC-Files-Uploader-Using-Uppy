import { getS3Client } from "@/data/getS3Client";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

function isValidPart(part: any) {
  return (
    part &&
    typeof part === "object" &&
    Number(part.PartNumber) &&
    typeof part.ETag === "string"
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const client = getS3Client();
  const { uploadId } = params;
  const key = req.nextUrl.searchParams.get("key");
  const { parts } = await req.json();

  if (typeof key !== "string") {
    return NextResponse.json({
      status: 500,
      statusText:
        "s3: the object key must be passed as a query parameter. For example: ?key=abc.jpg",
    });
  }
  if (!Array.isArray(parts) || !parts.every(isValidPart)) {
    return NextResponse.json(
      {
        error: "s3: `parts` must be an array of {ETag, PartNumber} objects.",
      },
      { status: 500 }
    );
  }
  try {
    const data = await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: process.env.COMPANION_AWS_BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    );
    return NextResponse.json({ location: data?.Location });
  } catch (error) {
    console.log(error);
  }
}
