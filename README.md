# POC - Files Uploader Using Uppy

## Project Overview

The project utilizes Uppy, a sleek and modular file uploader for web applications. The project is divided into two main parts:

- **Client:** This directory contains nextjs web app
- **Companion Server:** This directory contains the server-side code, which helps to take away the complexity of authentication and the cost of downloading files from remote sources

## Key features of Uppy

- **Customizable UI:** You can customize the look and feel of Uppy to match your application's design.

- **Plugin System:** Uppy’s functionality can be extended with a variety of plugins like Dashboard, Drag and Drop, File Input, Status bar, Informer, Thumbnail Generator

- **Multiple Source Integrations**: Local files,
  Remote URLs,
  Google Drive,
  Dropbox,
  OneDrive,
  Instagram,
  Webcam,
  Unsplash,

- **Preprocessing and Postprocessing**: Uppy allows you to define preprocessing and postprocessing steps for your files, such as image compression or format conversion.

- **Chunked Uploads:** For large files, Uppy can split them into smaller chunks, uploading them in parallel to improve performance and reliability.

## Installation

1. Clone the repository

```
https://github.com/kashyap27102/Uppy-File-Uploader.git
```

2. Install dependencies for the client

```
cd client
npm install
```

3. Install dependencies for the companion server

```
cd companion-server
npm install
```

4. Set up environment variables

Create a .env file in the **client** and add the following environment variables

```
COMPANION_AWS_KEY=""
COMPANION_AWS_SECRET=""
COMPANION_AWS_REGION=""
COMPANION_AWS_BUCKET=""

NEXT_PUBLIC_COMPANION_URL="<COMPANION_SERVER_URL>"
```

Create a .env file in the **companion-server directory** and add the following environment variables:

```
COMPANION_GOOGLE_KEY=""
COMPANION_GOOGLE_SECRET=""

COMPANION_UNSPLASH_KEY=""
COMPANION_UNSPLASH_SECRET=""

AWS_ACCESS_KEY_ID="<YOUR_AWS_ACCESS_KEY>"
AWS_SECRET_ACCESS_KEY="<YOUR_AWS_ACCESS_SECRET>"
AWS_REGION="<AWS_REGION_NAME>"
S3_BUCKET="<YOUR_AWS_BUCKET_NAME>"
```

5. Run the client and companion server

In two separate terminal windows, run the following commands:

- For the client

```
cd client
npm run dev
```

- For the companion server

```
cd companion server
node index.js
```

## Getting Credentials

### Amazon S3

1. Sign in to the [AWS Management Console](https://aws.amazon.com/console/).
2. Navigate to the IAM (Identity and Access Management) service.
3. Create a new user with programmatic access.
4. Attach the policy AmazonS3FullAccess to the user.
5. Save the Access Key ID and Secret Access Key.
6. Create an S3 bucket by navigating to the S3 service and following the steps to create a new bucket. Note down the bucket name.

### Google Drive

1. Go to the [Google Cloud Console](https://console.developers.google.com/project).
2. Create a new project or select an existing one.
3. Navigate to APIs & Services > Credentials.
4. Create an OAuth 2.0 Client ID.
5. Configure the OAuth consent screen and set the application type to Web application.
6. Save the Client ID and Client Secret.

### Unsplash

1. Go to the [Unsplash Developer website](https://unsplash.com/oauth/applications).
2. Log in or sign up for an account.
3. Create a new application.
4. Save the Access Key and Secret Key.

### Dependencies
- [Nextjs](https://nextjs.org/) 
- [React Icon](https://react-icons.github.io/react-icons/)
- [Expressjs](https://expressjs.com/)
- [Uppy](https://uppy.io/)

### Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss any changes.
