const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// 유저 정보 값을 받아 토큰 값을 반환
const createUserToken = (user) => {
    const { email } = user;
    const token = jwt.sign({ 
        type: "JWT", 
        email, 
    }, process.env.JWT_SECRET, { expiresIn: "24h", issuer: "토큰발급자" });
    return token;
}

module.exports = createUserToken;