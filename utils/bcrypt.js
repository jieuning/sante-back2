const bcrypt = require("bcrypt");

hashPassword = async (password) => {
  const saltRounds = 10; // 솔트 라운드 수, 더 높을수록 해시는 더 강력하지만 느려집니다.
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
module.exports = hashPassword;
