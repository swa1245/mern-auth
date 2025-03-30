import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDb from "./config/mongodb.js";
import authRouter from './routes/user.route.js'

const app = express();
const port = process.env.PORT || 5000;
connectDb()

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true, //to send cookie creditianls
  })
);
// api end points
app.get("/", (req, res) => {
  res.send("hii");
});
app.use('/api/auth',authRouter)

app.listen(port, () => {
  console.log(`server started ${port}`);
});
