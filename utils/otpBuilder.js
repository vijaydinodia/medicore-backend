const bcrypt = require("bcrypt");
const moment = require("moment");

const otpBuilder = async (user) => {
  // generate 6 digit otp
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // hash otp
  const hashedOtp = await bcrypt.hash(otp, 10);

  // save hashed otp
  user.otp = hashedOtp;

  // expire time
  user.otpExpire = moment().add(5, "minutes").toDate();

  // save user
  await user.save();

  // return original otp
  return otp;
};

module.exports = otpBuilder;