import Image from "next/image";
import Link from "next/link";
import { FaCloudUploadAlt, FaMagic } from "react-icons/fa";

export default function Home() {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-screen flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-5xl font-extrabold text-white shadow-lg">
        Let&apos;s Start to Upload Files With Uppy
      </h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center bg-white rounded-lg shadow-xl p-6 transform hover:scale-105 transition-transform">
          <FaCloudUploadAlt className="text-6xl text-blue-500 mb-4" />
          <p className="text-lg text-gray-700 mb-4">Dashboard Plugin is built-in Uploading UI</p>
          <Link href="/dashboard-plugin">
            <p className="w-fit bg-blue-500 px-4 py-2 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors">
              Dashboard Plugin
            </p>
          </Link>
        </div>
        <div className="flex flex-col items-center bg-white rounded-lg shadow-xl p-6 transform hover:scale-105 transition-transform">
          <FaMagic className="text-6xl text-purple-500 mb-4" />
          <p className="text-lg text-gray-700 mb-4">
            We have built our custom UI using Uppy Elements (Drag&Drop Plugin, Status Bar, Progressbar)
          </p>
          <Link href="/custom-ui">
            <p className="w-fit bg-purple-500 px-4 py-2 text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 transition-colors">
              Custom UI
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
