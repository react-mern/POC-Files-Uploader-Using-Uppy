"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Uppy, { UploadResult, UppyFile } from "@uppy/core";
import Webcam from "@uppy/webcam";
import Audio from "@uppy/audio";
import GoogleDrive from "@uppy/google-drive";
import AwsS3 from "@uppy/aws-s3";
import Url from "@uppy/url";
import Unsplash from "@uppy/unsplash";
import DragDrop from "@uppy/drag-drop";
import ProgressBar from "@uppy/progress-bar";
import StatusBar from "@uppy/status-bar";
import Informer from "@uppy/informer";
import ScreenCapture from "@uppy/screen-capture";

// import css files for plugin
import "@uppy/core/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/webcam/dist/style.min.css";
import "@uppy/audio/dist/style.min.css";
import "@uppy/screen-capture/dist/style.min.css";
import "@uppy/progress-bar/dist/style.min.css";
import "@uppy/drop-target/dist/style.css";
import "@uppy/status-bar/dist/style.min.css";
import "@uppy/informer/dist/style.min.css";

import { FaFile } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const PLUGIN_MAP: any = {
  device: {
    class: DragDrop,
    options: {
      id: "device",
      target: "#uppy-device",
      note: "Max file size 100 MB allowed",
      devicee: {
        strings: {
          browse: "Click to upload from device",
        },
      },
    },
  },
  webcam: {
    class: Webcam,
    options: {
      id: "webcam",
      target: "#uppy-webcam",
      modes: ["video-audio", "picture"],
    },
  },
  audio: {
    class: Audio,
    options: {
      id: "audio",
      target: "#uppy-audio",
    },
  },
  screencap: {
    class: ScreenCapture,
    options: {
      id: "screencap",
      target: "#uppy-screencap",
    },
  },
  url: {
    class: Url,
    options: {
      id: "url",
      target: "#uppy-url",
      companionUrl: process.env.NEXT_PUBLIC_COMPANION_URL!,
    },
  },
  unsplash: {
    class: Unsplash,
    options: {
      id: "unsplash",
      target: "#uppy-unsplash",
      companionUrl: process.env.NEXT_PUBLIC_COMPANION_URL!,
      replaceTargetContent: true,
    },
  },
  drive: {
    class: GoogleDrive,
    options: {
      id: "drive",
      target: "#uppy-drive",
      companionUrl: process.env.NEXT_PUBLIC_COMPANION_URL!,
    },
  },
};

function DragAndDropPluginPage() {
  const uppy = useRef<Uppy>();
  const [selectedFiles, setSelectedFiles] = useState<UppyFile[]>([]);
  const [source, setSource] = useState("device");
  const [selectedPlugin, setSelectedPlugin] = useState("");

  useEffect(() => {
    // create uppy instance
    uppy.current = new Uppy({
      id: "U-02",
      autoProceed: false,
      restrictions: {
        maxFileSize: 100 * 1024 * 1024, // maximum file size is 100 MB
        minFileSize: 1 * 1024, // minimum file size is 1 KB
        maxNumberOfFiles: 15,
        minNumberOfFiles: 1,
      },
      onBeforeFileAdded(currentFile, files) {
        console.log("NEW FILE ADD : " + currentFile.name);
        return true;
      },
      onBeforeUpload(files) {
        console.log(files.length + " FILES ARE READY TO UPLOAD");
        return true;
      },
      infoTimeout: 3000,
    })
      .use(Informer, { target: "#informer" })
      .use(ProgressBar, {
        target: "#progress-bar",
        fixed: true,
      })
      .use(AwsS3, {
        id: "awsplugin",

        // ========== Non Multipart Uploads ==========

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

        shouldUseMultipart(file) {
          return file.size > 50 * 2 ** 20;
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
      .use(StatusBar, { target: "#status-bar" })
      .on("file-added", (file: UppyFile) => {
        setSelectedFiles((prev: UppyFile[]) => [...prev, file]);
        uppy.current?.info("File added Successfully", "info", 2000);
      })
      .on("file-removed", (removedFile: UppyFile) => {
        setSelectedFiles((prev: UppyFile[]) =>
          prev.filter((file: UppyFile) => file.id != removedFile.id)
        );
        uppy.current?.info("File removed Successfully", "info", 2000);
      })
      .on("upload", (files: { id: string; fileIDs: string[] }) => {
        console.log(files.fileIDs);
      })
      .on("complete", (result: UploadResult) => {
        uppy.current?.info("Files are uploaded Successfully", "info", 2000);
        console.log(result);
        setSelectedFiles([]);
      });

    // close uppy instance
    return () => {
      uppy.current?.close();
    };
  }, []);

  // remove single file from uppy
  const onDeleteFileHandler = (id: string) => {
    uppy.current?.removeFile(id);
  };

  // add plugin to select source file
  const addPlugin = useCallback(
    (val: string) => {
      const instance = uppy.current?.getPlugin(selectedPlugin);

      if (instance) {
        uppy.current?.removePlugin(instance);
      }

      const plugin = PLUGIN_MAP[val];
      if (plugin) {
        setSelectedPlugin(plugin.options.id);
        uppy.current?.use(plugin.class, plugin.options);
      }
    },
    [selectedPlugin]
  );

  // handler to click button
  const onClickHandler = (e: any) => {
    const val = e.target.value;
    setSource(val);
    addPlugin(val);
  };

  return (
    <div className="min-h-screen grid grid-cols-2 gap-8 items-center justify-center w-full bg-gradient-to-r from-gray-100 to-gray-300 p-8">
      <div className="col-span-2 flex flex-col lg:flex-row rounded-lg bg-white shadow-2xl p-10 space-y-8 lg:space-y-0 lg:space-x-8">
        {/* Upload Section */}
        <div className="flex-1 p-4 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Import Files from:
            </h3>
          </div>
          <div className="flex flex-wrap gap-4 py-4 items-center">
            {[
              "audio",
              "url",
              "unsplash",
              "webcam",
              "device",
              "screencap",
              "drive",
            ].map((source) => (
              <button
                key={source}
                value={source}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-300"
                onClick={onClickHandler}
              >
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </button>
            ))}
          </div>
          <div className="h-[500px] bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner overflow-auto">
            {Object.keys(PLUGIN_MAP).map((key) => (
              <div
                key={key}
                id={`uppy-${key}`}
                className="h-full"
                hidden={source !== key}
              ></div>
            ))}
          </div>
        </div>

        {/* Uploaded Files Section */}
        <div className="flex-1 bg-gray-100 rounded-lg relative shadow-inner overflow-hidden ">
          <div className="bg-blue-600 text-white p-4 font-semibold rounded-t-lg shadow-md">
            <span className="text-xl">Selected Files</span>
          </div>
          <div className="p-4 space-y-4 overflow-auto min-h-[600px]">
            {selectedFiles.map((file: any) => (
              <div
                key={file.id}
                className="bg-white p-3 rounded-lg flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  <FaFile className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-700">{file.name}</p>
                    <p className="text-gray-500 text-sm">{`${(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(5)} MB`}</p>
                  </div>
                </div>
                <MdDelete
                  className="text-red-500 cursor-pointer"
                  onClick={() => onDeleteFileHandler(file.id)}
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white shadow-md rounded-b-lg">
            <div id="progress-bar"></div>
            <div id="status-bar"></div>
          </div>
        </div>
      </div>
      <div id="informer" className="col-span-2 mt-8"></div>
    </div>
  );
}

export default DragAndDropPluginPage;
