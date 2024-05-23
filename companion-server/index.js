const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const uppy = require("@uppy/companion");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(
  session({
    secret: "some-secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  next();
});

// Routes
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("Welcome to Companion");
});

// initialize uppy
const uppyOptions = {
  s3: {
    getKey: (req, filename) => filename,
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    key: process.env.AWS_ACCESS_KEY_ID,
  },
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET,
    },
    unsplash: {
      key: process.env.COMPANION_UNSPLASH_KEY,
      seceret: process.env.COMPANION_UNSPLASH_SECRET,
    },
  },
  server: {
    host: "localhost:5000",
    protocol: "http",
  },
  filePath: "./uploads",
  secret: "some-secret",
  debug: true,
};

app.use(uppy.app(uppyOptions).app);

// handle 404
app.use((req, res) => {
  return res.status(404).json({ message: "Not Found" });
});

// handle server errors
app.use((err, req, res) => {
  console.error("\x1b[31m", err.stack, "\x1b[0m");
  res.status(err.status || 500).json({ message: err.message, error: err });
});

uppy.socket(
  app.listen(5000, () => {
    console.log("server is running on port 5000");
  }),
  uppyOptions
);
