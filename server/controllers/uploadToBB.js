import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import base64 from "base-64";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
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
    const uploadToBB = await axios.post(uploadUrl, buffer, {
      headers: {
        Authorization: uploadAuthToken,
        "X-Bz-File-Name": encodeURIComponent(originalname),
        "Content-Type": mimetype,
        "X-Bz-Content-Sha1": "do_not_verify",
      },
    });

    res.status(200).json({ message: uploadToBB.data });
  } catch (error) {
    console.log(error);
  }
}

export { getPresignedUrl, upload };
