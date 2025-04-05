import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import base64 from "base-64";
import multer from "multer";
import AWS from "aws-sdk";

const upload = multer({
  storage: multer.memoryStorage(),
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1",
  signatureVersion: "v4",
});

async function getPresignedUrl(req, res) {
  try {
    // const { fileName, fileType } = req.body;
    const { originalname, mimetype, buffer } = req.file;
    const authString = `${process.env.B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`;
    const encodedAuth = base64.encode(authString);
    const authResponse = await axios.post(
      "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
      {},
      { headers: { Authorization: `Basic ${encodedAuth}` } }
    );

    const { apiUrl, authorizationToken } = authResponse.data;

    const uploadUrlResponse = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: process.env.B2_BUCKET_ID },
      { headers: { Authorization: authorizationToken } }
    );

    const { uploadUrl, authorizationToken: uploadAuthToken } =
      uploadUrlResponse.data;

    //upload to bb2
    const uploadToBBStream = axios.post(uploadUrl, buffer, {
      headers: {
        Authorization: uploadAuthToken,
        "X-Bz-File-Name": encodeURIComponent(originalname),
        "Content-Type": mimetype,
        "X-Bz-Content-Sha1": "do_not_verify",
      },
      maxBodyLength: Infinity,
    });

    // res.status(200).json({ message: uploadToBB.data });
    uploadToBBStream
      .then((response) => res.json(response.data))
      .catch((err) => res.status(500).json(err));
  } catch (error) {
    console.log(error);
  }
}

async function getPresignedUrlS3(req, res) {
  try {
    let { fileName, fileType } = req.body;

    const allowedZipTypes = ["application/zip", "application/x-zip-compressed"];
    if (!allowedZipTypes.includes(fileType)) {
      return res.status(400).json({ error: " Only .zip files are allowed!" });
    }

    fileType = "application/zip";

    //Enforce .zip file validation
    if (!fileName.endsWith(".zip") || fileType !== "application/zip") {
      return res.status(400).json({ error: "Only .zip files are allowed!" });
    }

    const newFileName = `${uuidv4()}-${fileName}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${newFileName}`, // Path in S3
      Expires: 300, // URL valid for 60 seconds
      ContentType: fileType,
    };

    const signedUrl = await s3.getSignedUrlPromise("putObject", params);
    res.json({ uploadUrl: signedUrl, newFileName });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to generate URL" });
  }
}

export { getPresignedUrl, upload, getPresignedUrlS3 };
