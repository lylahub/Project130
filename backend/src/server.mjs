// Create server
import express from "express";
import router from "./routes.js";
import dotenv from "dotenv";
import { createServer } from "node:http";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();

const app = express();
const server = createServer(app);

app.use(bodyParser.json());
app.use(cors());

app.use("/", router);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
