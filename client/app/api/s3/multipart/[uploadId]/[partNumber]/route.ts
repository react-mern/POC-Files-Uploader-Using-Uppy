import { getS3Client } from "@/data/getS3Client";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

const expiresIn = 900;

function validatePartNumber(pn: number) {
  const partNumber = Number(pn);
  return (
    Number.isInteger(partNumber) && partNumber >= 1 && partNumber <= 10_000
  );
}
export async function GET(
  req: NextRequest,
  { params }: { params: { uploadId: string; partNumber: number } }
) {
  const { uploadId, partNumber } = params;
  const key = req.nextUrl.searchParams.get("key");

  if (!validatePartNumber(partNumber)) {
    return NextResponse.json(
      {},
      {
        status: 500,
        statusText:
          "s3: the part number must be an integer between 1 and 10000.",
      }
    );
  }
  if (typeof key !== "string") {
    return NextResponse.json({
      status: 500,
      statusText:
        "s3: the object key must be passed as a query parameter. For example: ?key=abc.jpg",
    });
  }

  const url = await getSignedUrl(
    getS3Client(),
    new UploadPartCommand({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: "",
    }),
    { expiresIn }
  );

  return NextResponse.json({
    url,
    expires: expiresIn,
  });
}
