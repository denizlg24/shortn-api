const express = require("express");
const router = express.Router();
const geoip = require("geoip-lite");
const useragent = require('useragent');
const DeviceDetector = require("device-detector-js");
useragent(true);

function getCountryCodeFromRequest(req) {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  return geo ? geo.country : "Other";
}

const Url = require("../models/Url");

// @route   GET /:code
// @desc    Redirect to long/original URL

router.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      // Get country code from request
      const countryCode = getCountryCodeFromRequest(req);
      const deviceDetector = new DeviceDetector();
      const userAgent = useragent.parse(req.headers['user-agent']);
      const device = deviceDetector.parse(userAgent);
      // Record click and update database
      await url.recordClick(countryCode ? countryCode : "Other" , device);

      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json("No URL found!");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(`Server error: ${err}`);
  }
});

module.exports = router;
