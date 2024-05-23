import { getS3Client } from "@/data/getS3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
const crypto = require("node:crypto");

const expiresIn = 900;

export const POST = async (req: NextRequest) => {
  const data = await req.json();
  const { filename, contentType } = data;
  const Key = `${crypto.randomUUID()}-${filename}`;

  try {
    const url = await getSignedUrl(
      getS3Client(),
      new PutObjectCommand({
        Bucket: process.env.COMPANION_AWS_BUCKET,
        Key,
        ContentType: contentType,
      }),
      { expiresIn }
    );

    return NextResponse.json({ url, method: "PUT" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal server Error" },
      { status: 500 }
    );
  }
};
