require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRouter = require("./router/userRouter");
const registerRouter = require("./router/registerRouter");
const authRouter = require("./router/authRouter");

const port = process.env.PORT;
const uri = process.env.MONGO_CONNECTION;

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// 라우터 세팅
app.use("/user", userRouter);
app.use("/register", registerRouter);
app.use("/auth", authRouter);

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB 연결 성공");
  })
  .catch((err) => {
    console.log("MongoDB 연결 실패 : ", err);
  });

app.listen(port, () => {
  console.log(`server on port ${port}`);
});

module.exports = app;
