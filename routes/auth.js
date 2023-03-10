const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const User = require("../models/User");
const BlockList = require("../models/TokenBlockList");
const router = express.Router();
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const Token = require("../models/VerificationTokens");
const generateUniqueId = require("generate-unique-id");
const ejs = require("ejs");
const path = require("path");

// @route   POST /api/auth/register
// @desc    Register User using email password
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const usernameFind = await User.findOne({ username, sub: /^authS/ });
  const emailFind = await User.findOne({ email, sub: /^authS/ });
  if (usernameFind) {
    return res.status(403).json("The provided username is already registered.");
  }
  if (emailFind) {
    return res.status(403).json("The provided email is already registered.");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const subId = generateUniqueId();
    const sub = `authS|${subId}`;
    const newUser = new User({
      sub,
      username,
      email,
      password: hashedPassword,
      profilePicture: `https://avatar.oxro.io/avatar.svg?name=${username}`,
      createdAt: new Date(),
    });

    await newUser.save();

    var token = new Token({
      _userId: newUser._id,
      token: require("crypto").randomBytes(16).toString("hex"),
    });
    token.save(function (err) {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }
      const hrefLink = `https://shortn.at/api/auth/confirmation/${email}/${token.token}`;
      ejs.renderFile(
        path.join(__dirname, "/verification.mail.ejs"),
        { username, hrefLink },
        {},
        function (err, str) {
          if (!err) {
            const transporter = nodemailer.createTransport(
              sendgridTransport({
                auth: {
                  api_key: process.env.EMAIL_SECRET,
                },
              })
            );
            var mailOptions = {
              from: process.env.EMAIL_FROM,
              to: email,
              subject: "Shortn Account Verification",
              html: str,
            };
            transporter.sendMail(mailOptions, function (err) {
              if (err) {
                return res.status(500).json({
                  msg: "Technical Issue!, Please click on resend for verify your Email.",
                });
              }
            });
            res.status(200).json("User Registered");
          } else {
            console.log(err);
          }
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

// @route   POST /api/auth/login
// @desc    Login and get accesss token
router.post("/login", async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const usernameFind = await User.findOne({
    username: emailOrUsername,
    sub: { $regex: /^authS\|/ },
  });
  const emailFind = await User.findOne({
    email: emailOrUsername,
    sub: { $regex: /^authS\|/ },
  });
  if (!usernameFind && !emailFind) {
    return res.status(404).json("No user found with that email or username");
  }
  if (emailFind) {
    try {
      if (await bcrypt.compare(password, emailFind.password)) {
        //handle successfull login
        const accessToken = jwt.sign(
          emailFind.toJSON(),
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30d" }
        );
        return res.status(200).json({ accessToken });
      } else {
        return res.status(403).json("Incorrect password!");
      }
    } catch (err) {
      return res.status(500).json(`Server error: ${err}`);
    }
  }
  if (usernameFind) {
    try {
      if (await bcrypt.compare(password, usernameFind.password)) {
        //handle successfull login
        const accessToken = jwt.sign(
          usernameFind.toJSON(),
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30d" }
        );
        return res.status(200).json({ accessToken });
      } else {
        return res.status(403).json("Incorrect password!");
      }
    } catch (err) {
      return res.status(500).json(`Server error: ${err}`);
    }
  }
});

// @route   GET /api/auth/authenticate
// @desc    Get user's info if authenticated
router.get("/authenticate", authenticateToken, async (req, res) => {
  const user = await User.findOne({ sub: req.userData.sub });
  user.password = "Redacted";
  return res.status(200).json(user);
});

// @route   GET /api/auth/confirmation/:email/:verToken
// @desc    Verify a users email adress!
router.get("/confirmation/:email/:verToken", async (req, res) => {
  const { email, verToken } = req.params;
  Token.findOne({ token: verToken }, function (err, token) {
    // token is not found into database i.e. token may have expired
    if (!token) {
      return res.status(400).send({
        msg: "Your verification link may have expired. Please click on resend for verify your Email.",
      });
    }
    // if token is found then check valid user
    else {
      User.findOne({ _id: token._userId, email }, function (err, user) {
        // not valid user
        if (!user) {
          return res.status(401).send({
            msg: "We were unable to find a user for this verification. Please SignUp!",
          });
        }
        // user is already verified
        else if (user.emailVerified) {
          return res
            .status(200)
            .send("User has been already verified. Please Login");
        }
        // verify user
        else {
          // change isVerified to true
          user.emailVerified = true;
          user.save(function (err) {
            // error occur
            if (err) {
              return res.status(500).send({ msg: err.message });
            }
            // account successfully verified
            else {
              return res.redirect('https://shortn.at');
            }
          });
        }
      });
    }
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post("/logout", async (req, res) => {
  const { accessToken } = req.body;
  const foundBlockedAccessToken = await BlockList.findOne({ accessToken });
  if (foundBlockedAccessToken) {
    return res.status(200).json("User already logged out");
  }
  try {
    const newBlockedToken = new BlockList({
      accessToken,
    });

    await newBlockedToken.save();
    return res.status(200).json("User logged out successfully");
  } catch (err) {
    return res.status(500).json(`Server error: ${err}`);
  }
});

// @route   GET /api/auth/subscription
// @desc    Get User Subscription
router.get(
  "/subscription",
  authenticateTokenForSubscriptionCheck,
  async (req, res) => {
    try {
      const user = await User.findOne({ sub: req.userData.sub });
      if (user) {
        return res.status(200).json(user.plan);
      }
      return res.status(404).json("User Not Found");
    } catch (error) {
      return res.status(500).json(`Server Error: ${error}`);
    }
  }
);

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.sendStatus(401);
  }
  const blockedToken = await BlockList.findOne({ accessToken: token });
  if (blockedToken) {
    return res.sendStatus(403);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      if (err.message === "jwt expired") {
        try {
          const newBlockedToken = new BlockList({
            accessToken: token,
          });
          await newBlockedToken.save();
        } catch (err) {
          return res.status(500).json(`Server error: ${err}`);
        }
        return res
          .status(403)
          .json({ message: "Session expired, login again!" });
      }
      return res.status(403).json({ message: err.message });
    }
    req.userData = user;
    next();
  });
}

async function authenticateTokenForSubscriptionCheck(req, res, next) {
  const { token } = req.body;
  if (!token) {
    return res.sendStatus(401);
  }
  const blockedToken = await BlockList.findOne({ accessToken: token });
  if (blockedToken) {
    return res.sendStatus(403);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      if (err.message === "jwt expired") {
        try {
          const newBlockedToken = new BlockList({
            accessToken: token,
          });
          await newBlockedToken.save();
        } catch (err) {
          return res.status(500).json(`Server error: ${err}`);
        }
        return res
          .status(403)
          .json({ message: "Session expired, login again!" });
      }
      return res.status(403).json({ message: err.message });
    }
    req.userData = user;
    next();
  });
}

module.exports = router;
