require("dotenv").config();
const router = require("express").Router();
const createUserToken = require("../utils/jwtUtil");
const { User } = require("../models/users");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const calculateAge = (birthYear) => {
  // 현재 년도 가져오기
  const currentYear = new Date().getFullYear();
  // 나이 계산
  const age = currentYear - birthYear;

  let ageNumber;

  switch (true) {
    case age >= 12 && age <= 14:
      ageNumber = 1;
      break;
    case age >= 15 && age <= 18:
      ageNumber = 2;
      break;
    case age >= 19 && age <= 29:
      ageNumber = 3;
      break;
    case age >= 30 && age <= 49:
      ageNumber = 4;
      break;
    case age >= 50 && age <= 64:
      ageNumber = 5;
      break;
    default:
      ageNumber = 6;
      break;
  }
  return ageNumber;
};

const whatGender = (genderInfo) => {
  if (genderInfo === "women" || genderInfo === "female") {
    return "여성";
  } else {
    return "남성";
  }
};

router.post("/kakao", async (req, res) => {
  try {
    const { email, password, age, gender } = req.body;

    const genderToKor = whatGender(gender);

    const birthyear = Number(age);
    const birthYearNumber = calculateAge(birthyear);

    // 일치하는 유저가 있는지 찾기
    const findUser = await User.findOne({ email: email });

    if (!findUser) {
      // 일치하는 유저가 없으면 새로운 유저 생성 및 db에 저장
      const newUser = new User({
        email: email,
        password: password,
        age: birthYearNumber,
        gender: genderToKor,
      });

      await newUser.save();

      // 새로운 유저 데이터 생성
      const token = createUserToken(newUser);
      return res.status(200).json({
        code: 200,
        message: "토큰이 생성되었습니다.",
        token: token,
        email: newUser.email,
        gender: newUser.gender,
        age: newUser.age,
      });
    } else {
      // 기존 유저 데이터 생성
      const token = createUserToken(findUser);
      return res.status(200).json({
        code: 200,
        message: "토큰이 생성되었습니다.",
        token: token,
        email: findUser.email,
        gender: findUser.gender,
        age: findUser.age,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "내부 서버 오류" });
  }
});

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_PWD,
  process.env.GOOGLE_REDIRECT_URL
);

router.post("/google", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Referrer-Policy", "no-referrer-when-downgrade"); //NOTE: for using http

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", //NOTE force refresh token to be created
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/user.birthday.read",
      "https://www.googleapis.com/auth/user.gender.read",
    ],
  });

  res.json({ url: authorizeUrl });
});

async function getUserData(access_token) {
  try {
    const [basicProfileResponse, detailedProfileResponse] = await Promise.all([
      axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      axios.get(
        `https://people.googleapis.com/v1/people/me?personFields=birthdays,genders,emailAddresses`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      ),
    ]);

    const email = detailedProfileResponse.data.emailAddresses?.[0]?.value;
    // console.log("email:", email);

    const genderInfo = detailedProfileResponse.data.genders?.[0]?.value;
    const gender = whatGender(genderInfo);
    // console.log("Gender:", gender);

    const birthdateData = detailedProfileResponse.data.birthdays?.find(
      (birthday) => birthday.metadata.primary
    );

    let birthdayYear = "";
    if (birthdateData) {
      const { year } = birthdateData.date;
      console.log(`Birthday: ${year}`);
      birthdayYear = String(year);
    } else {
      console.log("Primary birthday is not available.");
    }

    const age = calculateAge(birthdayYear);

    return {
      basicProfile: basicProfileResponse.data,
      detailedProfile: {
        email,
        password: email,
        age,
        gender,
      },
    };
  } catch (error) {
    console.error("Error fetching user data", error);
    throw error;
  }
}

router.post("/google/token", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Referrer-Policy", "no-referrer-when-downgrade"); //NOTE: for using http

  const code = req.body.code;
  console.log("my code", code);

  try {
    const response = await oAuth2Client.getToken(code);
    await oAuth2Client.setCredentials(response.tokens);
    console.log("Tokens acquired");
    const user = oAuth2Client.credentials;
    const userDetails = await getUserData(user.access_token);
    const genderInfo = userDetails.detailedProfile.gender;
    const gender = whatGender(genderInfo);
    const age = userDetails.detailedProfile.age;
    const email = userDetails.basicProfile.email;
    const password = userDetails.basicProfile.password;

    const existingUser = await User.findOne({ email: email });
    console.log("-----existingUser------", existingUser);

    if (!existingUser) {
      console.log("email", email);
      console.log("password", password);
      console.log("gender", gender);
      console.log("age", age);
      const newUser = new User({
        email,
        password,
        gender,
        age,
      });
      await newUser.save();
    }

    let userToTokenize = existingUser || newUser;

    const jwToken = createUserToken(userToTokenize);
    return res.json({ jwToken, email, gender, age });
  } catch (err) {
    console.error("Error with signing in with Google", err);
  }
});

module.exports = router;
