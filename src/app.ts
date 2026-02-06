import express from "express";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes.ts";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public"))); // for HTML pages
app.use("/api", routes);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
