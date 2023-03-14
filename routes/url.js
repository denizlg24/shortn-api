const express = require("express");
const validUrl = require("valid-url");
const shortID = require("shortid");
const User = require("../models/User");
const Url = require("../models/Url");
const { remove } = require("../models/User");
const router = express.Router();

// @route   POST /api/url/shorten
// @desc    Create short URL
router.post("/shorten", async (req, res) => {
  const { longUrl, userId, customCode } = req.body;
  const baseUrl = "https://shortn.at";

  //Check base url
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json("The provided base URL is not valid!");
  }

  //Check long URL
  if (!validUrl.isUri(longUrl)) {
    return res.status(401).json("The provided URL is not valid!");
  }

  //Create url code
  try {
    /*let url = await Url.findOne({ longUrl });
    if (url) {
      res.json({ longUrl: url.longUrl, shortUrl: url.shortUrl });
    } else {*/
    const owner = await User.findOne({ sub: userId });
    if (!owner) {
      return res.status(404).json("The user does no longer exist!");
    }
    const ownersPlan = owner.plan.subscription;
    const ownersLinks = owner.links_this_month;
    if (ownersPlan === "free") {
      if (ownersLinks >= 3) {
        return res
          .status(403)
          .json("You have exceeded your plan's URLS/month.");
      }
      if (customCode) {
        return res
          .status(403)
          .json("Your plan does not include a custom code!");
      }
    }
    if (ownersPlan === "basic") {
      if (ownersLinks >= 25) {
        return res
          .status(403)
          .json("You have exceeded your plan's URLS/month.");
      }
      if (customCode) {
        return res
          .status(403)
          .json("Your plan does not include a custom code!");
      }
    }
    if (ownersPlan === "plus") {
      if (ownersLinks >= 50) {
        return res
          .status(403)
          .json("You have exceeded your plan's URLS/month.");
      }
      if (customCode) {
        return res
          .status(403)
          .json("Your plan does not include a custom code!");
      }
    }
    const urlCode = !customCode ? shortID.generate() : customCode;
    const shortUrl = baseUrl + "/" + urlCode;

    const previousUrl = await Url.findOne({ urlCode });
    if (previousUrl) {
      return res
        .status(403)
        .json("We are sorry, but that link is already taken.");
    }

    const url = new Url({
      userId,
      urlCode,
      longUrl,
      shortUrl,
      date: new Date(),
    });

    await url.save();
    await owner.updateOne({ $set: { links_this_month: ownersLinks + 1 } });
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
      const sub = url.userId;
      const owner = await User.findOne({ sub });
      if (!owner) {
        return res.status(404).json("The user does no longer exist!");
      }
      const ownersPlan = owner.plan.subscription;
      if (ownersPlan === "free") {
        return res
          .status(200)
          .json({ clicks: { lastClick: url.clicks.lastClick }, shortUrl });
      }
      if (ownersPlan === "basic") {
        return res.status(200).json({
          clicks: {
            lastClick: url.clicks.lastClick,
            total: url.clicks.total,
          },
          shortUrl,
        });
      }
      if (ownersPlan === "plus") {
        return res.status(200).json({
          clicks: {
            lastClick: url.clicks.lastClick,
            total: url.clicks.total,
            byTimeOfDay: url.clicks.byTimeOfDay,
          },
          shortUrl,
        });
      }
      return res.status(200).json(url);
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
    if (url) {
      res.json(url);
    } else {
      return res.status(404).json("No Urls for this user");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

// @route   POST /api/url/remove
// @desc    Remove a specific url
router.post("/remove", async (req, res) => {
  const { shortUrl } = req.body;
  try {
    let removed = await Url.findOneAndRemove({ shortUrl });
    if (removed) {
      const sub = removed.userId;
      try {
        const owner = await User.findOne({ sub });
        if (!owner) {
          return res.status(200).json("Removed the link but found no user.");
        }
        try {
          await owner.updateOne({ $set: { links_this_month: owner.links_this_month - 1 } });
          return res.status(200).json("Removed the link and updated user.");
        } catch (err) {
          console.log(err);
          return res.status(500).json(`Server error: ${err}`);
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json(`Server error: ${err}`);
      }
    }
    return res.status(404).json("No Url to remove");
  } catch (err) {
    console.log(err);
    return res.status(500).json(`Server error: ${err}`);
  }
});

module.exports = router;
