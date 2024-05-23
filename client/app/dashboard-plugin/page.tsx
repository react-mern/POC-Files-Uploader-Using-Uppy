"use client";
import React, { useEffect } from "react";

import Uppy, { UploadResult, UppyFile } from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Webcam from "@uppy/webcam";
import Audio from "@uppy/audio";
import ScreenCapture from "@uppy/screen-capture";
import AwsS3 from "@uppy/aws-s3";
import ImageEditor from "@uppy/image-editor";
import RemoteTarget from "@uppy/remote-sources";
import Compressor from "@uppy/compressor";

// import css files for plugin
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/webcam/dist/style.min.css";
import "@uppy/audio/dist/style.min.css";
import "@uppy/screen-capture/dist/style.min.css";
import "@uppy/image-editor/dist/style.min.css";
import "@uppy/informer/dist/style.min.css";

function DashboardPlugin() {
  useEffect(() => {
    // create uppy instance
    const uppy = new Uppy();

    uppy
      .use(Dashboard, {
        height: "700px",
        id: "dashboard-plugin-01",
        inline: true,
        target: "#uppy-dashboard",
        proudlyDisplayPoweredByUppy: false,
        showLinkToFileUploadResult: true,
      })
      .use(ImageEditor, {
        target: Dashboard,
      })
      .use(Webcam, {
        target: Dashboard,
        modes: ["video-audio", "picture"],
      })
      .use(Audio, { target: Dashboard })
      .use(ScreenCapture, {
        target: Dashboard,
        preferredVideoMimeType: "video/webm",
      })
      .use(Compressor, {
        limit: 5,
      })
      .use(RemoteTarget, {
        companionUrl: process.env.NEXT_PUBLIC_COMPANION_URL!,
        sources: ["GoogleDrive", "Unsplash", "Url"],
      })
      .use(AwsS3, {
        id: "myAWSPlugin",
        shouldUseMultipart(file) {
          return file.size > 50 * 2 ** 20;
        },

        // ========== Non-Multipart Uploads ==========

        /**
         * This method tells Uppy how to handle non-multipart uploads.
         * If for some reason you want to only support multipart uploads,
         * you don't need to implement it.
         */
        async getUploadParameters(file: any): Promise<any> {
          // Send a request to our Express.js signing endpoint.
          const response = await fetch("/api/sign-s3", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          });

          if (!response.ok) throw new Error("Unsuccessful request");

          // Parse the JSON response.
          const data = await response.json();

          // Return an object in the correct shape.
          return {
            method: data.method,
            url: data.url,
            fields: {}, // For presigned PUT uploads, this should be left empty.
            // Provide content type header required by S3
            headers: {
              "Content-Type": file.type,
            },
          };
        },

        // ========== Multipart Uploads ==========

        // The following methods are only useful for multipart uploads:
        // If you are not interested in multipart uploads, you don't need to
        // implement them (you'd also need to set `shouldUseMultipart: false` though).

        // A function that calls the S3 Multipart API to create a new upload.
        async createMultipartUpload(file) {
          const metadata: any = {};

          Object.keys(file.meta || {}).forEach((key) => {
            if (file.meta[key] != null) {
              metadata[key] = file.meta[key]?.toString();
            }
          });

          const response = await fetch("/api/s3/multipart", {
            method: "POST",
            // Send and receive JSON.
            headers: {
              accept: "application/json",
            },
            body: JSON.stringify({
              filename: file.name,
              type: file.type,
              metadata,
            }),
          });
          // console.log(response.json())
          if (!response.ok)
            throw new Error("Unsuccessful request", { cause: response });

          // Parse the JSON response.
          const data = await response.json();
          console.log(data);
          return data;
        },
        // A function that calls the S3 Multipart API to abort a Multipart upload, and removes all parts that have been uploaded so far.
        async abortMultipartUpload(file, { key, uploadId }) {
          const filename = encodeURIComponent(key);
          const uploadIdEnc = encodeURIComponent(uploadId);
          const response = await fetch(
            `/api/s3/multipart/${uploadIdEnc}?key=${filename}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok)
            throw new Error("Unsuccessful request", { cause: response });
        },
        // A function that generates a signed URL for the specified part number.
        async signPart(file, options) {
          const { uploadId, key, partNumber, signal } = options;

          signal?.throwIfAborted();

          if (uploadId == null || key == null || partNumber == null) {
            throw new Error(
              "Cannot sign without a key, an uploadId, and a partNumber"
            );
          }

          const filename = encodeURIComponent(key);
          const response = await fetch(
            `/api/s3/multipart/${uploadId}/${partNumber}?key=${filename}`,
            { signal }
          );

          if (!response.ok)
            throw new Error("Unsuccessful request", { cause: response });

          const data = await response.json();

          return data;
        },

        // A function that calls the S3 Multipart API to list the parts of a file that have already been uploaded.
        async listParts(file, { key, uploadId }) {
          const filename = encodeURIComponent(key);
          const response = await fetch(
            `/api/s3/multipart/${uploadId}?key=${filename}`
          );

          if (!response.ok)
            throw new Error("Unsuccessful request", { cause: response });

          const data = await response.json();

          return data;
        },
        // A function that calls the S3 Multipart API to complete a Multipart upload, combining all parts into a single object in the S3 bucket.
        async completeMultipartUpload(file, { key, uploadId, parts }) {
          const filename = encodeURIComponent(key);
          const uploadIdEnc = encodeURIComponent(uploadId);
          const response = await fetch(
            `/api/s3/multipart/${uploadIdEnc}/complete?key=${filename}`,
            {
              method: "POST",
              headers: {
                accept: "application/json",
              },
              body: JSON.stringify({ parts }),
            }
          );

          if (!response.ok)
            throw new Error("Unsuccessful request", { cause: response });

          const data = await response.json();

          return data;
        },
      })
      .on("file-added", (file:UppyFile) => {
        // you can access file that is added to uppy
        console.log("FILE ADD : " + file.name);
      })
      .on("file-removed", (file:UppyFile) => {
        console.log("FILE REMOVED : " + file.name);
      })
      .on("upload", (files: { id: string; fileIDs: string[] }) => {
        // access all the files that are upload
        files.fileIDs.map((id) => {
          console.log("FILE UPLOAD : " + id);
        });
      })
      .on("complete", (result:UploadResult) => {
        console.log(result.failed.length + " FILES ARE FAILED UPLOAD");
        console.log(
          result.successful.length + " FILES ARE SUCCESSFULLY UPLOAD"
        );
      });

    // close uppy instance
    return () => {
      uppy.close();
    };
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500">
      <div id="uppy-dashboard"></div>
    </div>
  );
}

export default DashboardPlugin;
