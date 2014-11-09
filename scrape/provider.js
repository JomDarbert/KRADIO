(function() {
  var app, bodyParser, express, fs, out_file, server, songs;

  express = require("express");

  bodyParser = require("body-parser");

  fs = require("fs");

  app = express();

  out_file = "songs.json";

  songs = [];

  app.all("/*", function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,PUT");
    next();
  });

  app.use(bodyParser.json());

  app.post("/update", function(req, res) {
    songs = req.body;
    return res.sendStatus(200);
  });

  app.get("/today", function(req, res) {
    if (songs.length <= 0) {
      console.log("sending old");
      return fs.readFile(out_file, "utf8", "w", function(err, in_file) {
        if (err) {
          throw err;
        }
        if (!err) {
          songs = JSON.parse(in_file);
          return res.send(songs[0].data);
        }
      });
    } else {
      console.log("sending existing");
      return res.send(songs[0].data);
    }
  });

  server = app.listen(3000, function() {
    var host, port;
    host = server.address().address;
    port = server.address().port;
    return console.log("Example app listening at http://" + host + ":" + port);
  });

}).call(this);
