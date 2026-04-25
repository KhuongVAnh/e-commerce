import path from "path";
import dotenv from "dotenv";

const serviceRoot = path.resolve(__dirname, "../..");
const backendRoot = path.resolve(serviceRoot, "..");

dotenv.config({ path: path.join(serviceRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env") });
