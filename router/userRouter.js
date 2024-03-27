const router = require("express").Router();
const authenticateToken = require("../middleware/authenticateToken");
const { User, Exercise, Food } = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

router.get("/check", authenticateToken, async (req, res) => {
  try {
    const { email } = req.decoded;
    console.log("데이터 요청 받음:", {
      email: email,
    });

    const user = await User.findOne({
      email: email,
    });
    console.log("사용자 찾음:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = {
      user: user,
    };
    console.log("데이터:", result);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const key = process.env.JWT_SECRET;
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 해싱된 값과 비교
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ code: 401, message: "비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign(
      {
        type: "JWT",
        email: email,
      },
      key,
      {
        expiresIn: "24h",
        issuer: "토큰발급자",
      }
    );

    return res.status(200).json({
      code: 200,
      message: "토큰이 생성되었습니다.",
      token: token,
      email: user.email,
      gender: user.gender,
      age: user.age,
    });
  } catch (error) {
    return res.status(419).json({
      code: 419,
      message: error,
    });
  }
});

router.put("/", authenticateToken, async (req, res) => {
  try {
    const user = req.body;

    console.log("user", user);

    const updatedUser = await User.findOneAndUpdate(
      {
        email: user.email,
      },
      user,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res
      .status(200)
      .json({ message: "사용자 정보가 업데이트되었습니다.", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "서버 오류: 사용자 정보를 업데이트할 수 없습니다.",
    });
  }
});

// 개별 유저 삭제
router.delete("/", authenticateToken, async (req, res) => {
  const email = req.decoded.email;

  User.deleteOne({ email: email })
    .exec()
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      res.sendStatus(500);
      console.log(err);
    });
});

router.get("/payload", authenticateToken, async (req, res) => {
  console.log(req.decoded);
  const { email } = req.decoded;

  return res.status(200).json({
    code: 200,
    message: "토큰이 정상입니다.",
    data: {
      email: email,
    },
  });
});

module.exports = router;
