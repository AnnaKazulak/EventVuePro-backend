const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

const nodemailer = require("nodemailer");

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", async (req, res, next) => {
  const { email, password, name } = req.body;

  if (email === "" || password === "" || name === "") {
    res.status(400).json({ message: "Provide email, password, and name" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must have at least 6 characters and contain at least one number, one lowercase, and one uppercase letter.",
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({ message: "User already exists." });
      return;
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = await User.create({ email, password: hashedPassword, name });

    // Send verification email
    await sendVerificationEmail(newUser.email, newUser._id);

    res.status(201).json({ user: newUser });
  } catch (error) {
    next(error);
  }
});

const sendVerificationEmail = async (email, userId) => {
  try {
    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    const verfLink = `${process.env.PUBLIC_APP_URL}/auth/verify-email/${userId}`

    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Email Verification",
      html: `
        <p>Click the following link to verify your email:</p>
        <p><a href="${verfLink}">Verify Email</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
};

module.exports = { sendVerificationEmail };



// POST /auth/send-verification-email  - Sends a verification email to the user
router.post("/send-verification-email", async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.verified) {
      res.status(400).json({ message: "User's email is already verified." });
      return;
    }

    // Send verification email
    await sendVerificationEmail(user.email, user._id);

    res.status(200).json({ message: "Verification email sent successfully." });
  } catch (error) {
    next(error);
  }
});




// GET /auth/verify-email/:userId - Verifies user's email
router.get("/verify-email/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Mark user as verified
    user.verified = true;
    await user.save(); // Update the user's verified status in the database

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login - Verifies email and password and returns a JWT
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty string
  if (email === "" || password === "") {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      // If the user is not found, send an error response
      res.status(401).json({ message: "User not found." });
      return;
    }

    // Check if the user's email is verified
    if (!user.verified) {
      res.status(401).json({ message: "Email not verified. Please verify your email before logging in." });
      return;
    }

    // Compare the provided password with the one saved in the database
    const passwordCorrect = await bcrypt.compare(password, user.password);

    if (passwordCorrect) {
      // Deconstruct the user object to omit the password
      const { _id, email, name } = user;

      // Create an object that will be set as the token payload
      const payload = { _id, email, name };

      // Create a JSON Web Token and sign it
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });

      // Send the token as the response
      res.status(200).json({ authToken: authToken });
    } else {
      // If the password is incorrect, send an error response
      res.status(401).json({ message: "Incorrect email or password." });
    }
  } catch (error) {
    next(error);
  }
});


router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

module.exports = router;
