import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import getPresignedUrl from "./routes/uploadToBBRoute.js";
import uploadMetadata from "./routes/logsMetadataRoute.js";
import getLogs from "./routes/logsRetrieveRoute.js";
import logRoutes from "./routes/logRoutes.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("This is base root");
});

//Routes
app.use("/api", getPresignedUrl);
app.use("/api/logs", uploadMetadata);
app.use("/api/get-logs", getLogs);
app.use("/api", logRoutes);

const port = process.env.PORT || 8800;
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
