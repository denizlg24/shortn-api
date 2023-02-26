const express = require("express");
const validUrl = require("valid-url");
const shortID = require("shortid");

const Url = require("../models/Url");
const router = express.Router();

// @route   POST /api/url/shorten
// @desc    Create short URL
router.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  const baseUrl ="http://shortn-21539.nodechef.com";

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
      urlCode,
      longUrl,
      shortUrl,
      date: new Date(),
    });

    await url.save();

    res.json({ longUrl: url.longUrl, shortUrl: url.shortUrl });
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
      res.json(url.clicks);
    } else {
      return res.status(404).json("The provided short URL was not found!");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

module.exports = router;
