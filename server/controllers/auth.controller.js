import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import tarnsporter from "../config/nodemailer.js";
import { use } from "react";

export const register = async (req, res) => {
  const { email, name, password } = req.body;

  // Validate that required fields are present
  if (!name || !email || !password) {
    return res.json({
      success: false,
      message: "Details are missing",
    });
  }

  try {
    // Check if the user already exists in the database
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();

    // Generate a JWT token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set the token in the browser's cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Token expires in 7 days
    });

    // Send a welcome email to the user
    console.log("Recipient Email:", email); // Log email for debugging
    if (!email) {
      return res.json({
        success: false,
        message: "Email is missing or invalid",
      });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL, // Sender email (should be a verified email in Brevo)
      to: email, // Recipient email (user's email)
      subject: "Welcome to Our Platform",
      text: `Welcome! Your account has been successfully created using ${email}.`,
    };

    // Send the email using the transporter
    await tarnsporter.sendMail(mailOptions);

    // Return success response
    return res.json({
      success: true,
      message: "User registered and welcome email sent.",
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      success: false,
      message: "details are incorrect",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        message: "user is not exist ",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "password doesnt match ",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      success: true,
    });
  } catch (err) {
    return res.json({
      message: err.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      success: true,
      message: "logout sucessful",
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

export const sendVerfiyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (user.isAccountVerfifed) {
      return res.json({
        success: false,
        message: "account already verfied",
      });
    }
    // otp genrate
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpEpiryAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL, // Sender email (should be a verified email in Brevo)
      to: user.email, // Recipient email (user's email)
      subject: "Account verfiaction otp",
      text: `Your otp is ${otp} `,
    };
    await tarnsporter.sendMail(mailOption);
    return res.json({
      success: true,
      message: "verfiaction otp send sucessful.",
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.json({
      success: false,
      message: "invalid otp or missing details",
    });
  }
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "missing detail of user",
      });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({
        success: false,
        message: "invalid otp",
      });
    }
    if (user.verifyOtpEpiryAt < Date.now()) {
      return res.json({
        success: false,
        message: "otp is expired",
      });
    }
    user.isAccountVerfifed = true;
    user.verifyOtp = "";
    user.verifyOtpEpiryAt = 0;

    await user.save();

    return res.json({
      success: true,
      message: "email verfied sucessful",
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
};
