const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { uploadImage } = require("../utils/cloudnairy");
const mailSender = require("../utils/mailSender");
const signupTemplate = require("../templates/signupTemplate");
const otpBuilder = require("../utils/otpBuilder");
const forgotPasswordTemplate = require("../templates/forgotPasswordTemplate");

const saltRounds = 10;

//sign up
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, age, gender, password, role } = req.body;

    // validation
    if (!(name && email && phone && age && gender && password)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // hash password
    const hashPassword = await bcrypt.hash(password, saltRounds);

    // create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      age,
      gender,
      password: hashPassword,
      role,
    });

    // send mail
    await mailSender(
      email,
      "Account Created Successfully",
      signupTemplate(name, email, password, newUser.role),
    );

    // response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //check user exists or not

    const exists = await User.findOne({ email });

    if (!exists) {
      return res.status(400).json({
        success: false,
        message: "User not exists",
      });
    }

    const match = await bcrypt.compare(password, exists.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Password is wrong",
      });
    }

    //create token
    const token = jwt.sign(
      {
        _id: exists._id,
        email: exists.email,
        role: exists.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "login successful",
      role: exists.role,
      token,
      user: {
        _id: exists._id,
        name: exists.name,
        email: exists.email,
        role: exists.role,
        status: exists.status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//forget
exports.forget = async (req, res) => {
  try {
    const { email } = req.body;

    // validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // check user
    const exists = await User.findOne({ email });

    if (!exists) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    // ensure OTP was verified
    if (!exists.isOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before resetting password",
      });
    }

    // generate otp
    const otp = await otpBuilder(exists);

    // send email
    await mailSender(
      email,
      "Password Reset OTP",
      forgotPasswordTemplate(exists.name, otp),
    );

    // response
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//verify otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!(email && otp)) {
      return res.status(400).json({
        success: false,
        message: "All field are required",
      });
    }

    const exists = await User.findOne({ email });

    if (!exists || !exists.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    if (moment().isAfter(exists.otpExpire)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, exists.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark verified
    exists.otp = null;
    exists.otpExpire = null;
    exists.isOtpVerified = true;
    await exists.save();

    return res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // validation
    if (!(email && newPassword)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check user
    const exists = await User.findOne({ email });

    if (!exists) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    // ensure OTP was verified
    if (!exists.isOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before resetting password",
      });
    }

    // OTP already verified in previous step (exists.isOtpVerified)
    // Flow: verify OTP -> submit only newPassword

    // hash new password
    const newHashPassword = await bcrypt.hash(newPassword, saltRounds);

    // update password
    exists.password = newHashPassword;

    // reset OTP verification flag after successful reset
    exists.isOtpVerified = false;

    await exists.save();

    // response

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//edit profile

exports.editProfile = async (req, res) => {
  try {
    const { name, email, phone, age, gender, profileImage } = req.body;

    const userId = req.user._id || req.user.id;

    // validation
    if (!(name && email && phone && age && gender)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check user exists
    const exists = await User.findById(userId);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const duplicate = await User.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { phone: phone.trim() }],
      _id: { $ne: userId },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already in use by another account",
      });
    }

    let profileImageUrl = exists.profileImage || "";

    if (req.files?.profileImage) {
      const uploaded = await uploadImage(req.files.profileImage);
      if (uploaded.length) {
        profileImageUrl = uploaded[0].secure_url || profileImageUrl;
      }
    } else if (profileImage && typeof profileImage === "string") {
      if (profileImage.startsWith("data:image")) {
        const matches = profileImage.match(
          /^data:(image\/[a-zA-Z]+);base64,(.+)$/,
        );
        if (!matches) {
          return res.status(400).json({
            success: false,
            message: "Invalid profile image format",
          });
        }

        const imageBuffer = Buffer.from(matches[2], "base64");
        const uploaded = await uploadImage({ buffer: imageBuffer });
        if (uploaded.length) {
          profileImageUrl = uploaded[0].secure_url || profileImageUrl;
        }
      } else if (profileImage.startsWith("http")) {
        profileImageUrl = profileImage;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        age,
        gender,
        profileImage: profileImageUrl,
      },
      {
        new: true,
      },
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
