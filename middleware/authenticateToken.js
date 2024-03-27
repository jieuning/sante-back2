const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  const key = process.env.JWT_SECRET;

  if (token == null) {
    return res.status(401).json({
      code: 401,
      message: "토큰이 없습니다.",
    });
  }

  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({
          code: 403,
          message: "토큰이 만료되었습니다.",
        });
      } else {
        return res.status(403).json({
          code: 403,
          message: "토큰이 유효하지 않습니다.",
        });
      }
    }
    req.decoded = decoded;
    next(); // 다음 미들웨어 또는 핸들러로 제어를 넘깁니다.
  });
};

module.exports = authenticateToken;
