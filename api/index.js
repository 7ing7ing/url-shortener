require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const validateUrl = require("url-validator");
const shortid = require("shortid");
const path = require('path');

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connection state = " + mongoose.connection.readyState);
  });

const URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model("Url", URLSchema);
app.use(cors());

//Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use("/public", express.static(path.join(__dirname, "..","public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

app.post("/api/shorturl", async function (req, res) {
  let url = req.body.url;
  let urlCode = shortid.generate();

  if (validateUrl(url) === false) {
    res.json({
      error: "invalid url",
    });
  } else {
    try {
      let findUrl = await Url.findOne({
        original_url: url,
      });

      if (findUrl) {
        res.json({
          original_url: findUrl.original_url,
          short_url: findUrl.short_url,
        });
      } else {
        findUrl = new Url({
          original_url: url,
          short_url: urlCode,
        });
        await findUrl.save();
        res.json({
          original_url: findUrl.original_url,
          short_url: findUrl.short_url,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
});

app.get("/api/shorturl/:short_url?", async function (req, res) {
  try {
    let findShortUrl = await Url.findOne({
      short_url: req.params.short_url,
    });
    if (findShortUrl) {
      return res.redirect(findShortUrl.original_url);
    } else {
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    console.log(err);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
