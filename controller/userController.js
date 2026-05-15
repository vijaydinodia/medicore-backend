const User = require("../model/userModel");
const Doctor = require("../model/doctorModel");
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
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
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
      email: normalizedEmail,
      phone: phone.trim(),
      age,
      gender,
      password: hashPassword,
      role: role || "user",
    });

    // send mail
    await mailSender(
      normalizedEmail,
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

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      const match = await bcrypt.compare(password, exists.password);

      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Password is wrong",
        });
      }

      let doctorProfile = null;
      if (exists.role === "doctor") {
        doctorProfile = exists.doctorId
          ? await Doctor.findById(exists.doctorId)
          : await Doctor.findOne({ email: exists.email });
      }

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
          name: doctorProfile?.doctorName || exists.name,
          doctorName: doctorProfile?.doctorName,
          email: exists.email,
          phone: exists.phone,
          age: exists.age,
          gender: exists.gender,
          profileImage: doctorProfile?.profileImage || exists.profileImage,
          role: exists.role,
          status: doctorProfile?.status || exists.status,
          hospitalId: exists.hospitalId,
          departmentId: doctorProfile?.departmentId || exists.departmentId,
          doctorId: doctorProfile?._id || exists.doctorId,
          specialization: doctorProfile?.specialization,
        },
      });
    }

    const doctor = await Doctor.findOne({ email: normalizedEmail });

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Doctor login account is missing. Please ask the hospital admin to recreate this doctor account.",
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
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

    if (!exists) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }


    // generate otp
    const otp = await otpBuilder(exists);

    // send email
    await mailSender(
      normalizedEmail,
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

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

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
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

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

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!(currentPassword && newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const account = await User.findById(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!account.password) {
      return res.status(400).json({
        success: false,
        message: "Password is not set for this account",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, account.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    account.password = await bcrypt.hash(newPassword, saltRounds);
    await account.save();

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
    const { name, age, gender, profileImage } = req.body;

    const userId = req.user._id || req.user.id;

    if (req.user.role === "doctor") {
      if (!(name && gender)) {
        return res.status(400).json({
          success: false,
          message: "Name and gender are required",
        });
      }

      const existingUser = await User.findById(userId);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const existingDoctor = existingUser.doctorId
        ? await Doctor.findById(existingUser.doctorId)
        : await Doctor.findOne({ email: existingUser.email });

      if (!existingDoctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      let profileImageUrl = existingDoctor.profileImage || "";

      if (req.file) {
        const uploaded = await uploadImage(req.file, "medicore/profiles");
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

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        existingDoctor._id,
        {
          doctorName: name.trim(),
          gender,
          profileImage: profileImageUrl,
        },
        { new: true },
      ).select("-password");

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name: name.trim(),
          gender,
          profileImage: profileImageUrl,
          doctorId: existingDoctor._id,
          hospitalId: updatedDoctor.hospitalId,
          departmentId: updatedDoctor.departmentId,
        },
        { new: true },
      ).select("-password");

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          ...updatedUser.toObject(),
          doctorName: updatedDoctor.doctorName,
          status: updatedDoctor.status,
          specialization: updatedDoctor.specialization,
          doctorId: updatedDoctor._id,
        },
      });
    }

    // validation
    if (!(name && age && gender)) {
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

    let profileImageUrl = exists.profileImage || "";

    if (req.file) {
      const uploaded = await uploadImage(req.file, "medicore/profiles");
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



