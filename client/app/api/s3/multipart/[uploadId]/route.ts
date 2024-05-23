import { getS3Client } from "@/data/getS3Client";
import {
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const client = getS3Client();
  const { uploadId } = params;
  const key = req.nextUrl.searchParams.get("key");

  if (typeof key !== "string") {
    return NextResponse.json({
      status: 500,
      statusText:
        "s3: the object key must be passed as a query parameter. For example: ?key=abc.jpg",
    });
  }

  const parts: any[] = [];

  function listPartPage(startAt: any) {
    client.send(
      new ListPartsCommand({
        Bucket: process.env.COMPANION_AWS_BUCKET,
        Key: key!,
        UploadId: uploadId,
        PartNumberMarker: startAt,
      }),
      (err, data) => {
        if (err) {
          return NextResponse.json({}, { status: 500, statusText: err });
        }
        parts.push(...data?.Parts!);

        if (data?.IsTruncated) {
          listPartPage(data.NextPartNumberMarker);
        } else {
          return NextResponse.json({ parts });
        }
      }
    );
  }
  listPartPage(0);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const client = getS3Client();
  const { uploadId } = params;
  const key = req.nextUrl.searchParams.get("key");

  if (typeof key !== "string") {
    return NextResponse.json({
      status: 500,
      statusText:
        "s3: the object key must be passed as a query parameter. For example: ?key=abc.jpg",
    });
  }

  try {
    const data = await client.send(
      new AbortMultipartUploadCommand({
        Bucket: process.env.COMPANION_AWS_BUCKET,
        Key: key,
        UploadId: uploadId,
      })
    );
    return NextResponse.json({});
  } catch (error) {
    console.log(error);
  }
}
