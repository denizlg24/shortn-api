const express = require("express");
const validUrl = require("valid-url");
const shortID = require("shortid");

const Url = require("../models/Url");
const router = express.Router();

// @route   POST /api/url/shorten
// @desc    Create short URL
router.post("/shorten", async (req, res) => {
  const { longUrl, userId } = req.body;
  const baseUrl ="https://shortn.at";

  //Check base url
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json("The provided base URL is not valid!");
  }

  //Check long URL
  if (!validUrl.isUri(longUrl)) {
    return res.status(401).json("The provided URL is not valid!");
  }

  //Create url code
  const urlCode = shortID.generate();
  try {
    /*let url = await Url.findOne({ longUrl });
    if (url) {
      res.json({ longUrl: url.longUrl, shortUrl: url.shortUrl });
    } else {*/
    const shortUrl = baseUrl + "/" + urlCode;

    url = new Url({
      userId,
      urlCode,
      longUrl,
      shortUrl,
      date: new Date(),
    });

    await url.save();

    res.json(url);
    //}
  } catch (err) {
    console.error(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

// @route   POST /api/url/stats
// @desc    Get short url stats
router.post("/stats", async (req, res) => {
  const { shortUrl } = req.body;
  try {
    let url = await Url.findOne({ shortUrl });
    if (url) {
      res.json(url);
    } else {
      return res.status(404).json("The provided short URL was not found!");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

// @route   POST /api/url/userUrl
// @desc    Get user's urls
router.post("/userUrl", async (req, res) => {
  const { userId } = req.body;
  try {
    let url = await Url.find({ userId });
    if(url) {
       res.json(url);
    } else {
       return res.status(404).json("No Urls for this user");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

module.exports = router;
