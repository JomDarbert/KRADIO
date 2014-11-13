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

  app.use(bodyParser.json({
    limit: '50mb'
  }));

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.post("/update", function(req, res) {
    songs = req.body;
    res.sendStatus(200);
    return console.log("Updated songs!");
  });

  app.post("/vote", function(req, res) {
    var query, s, tag, _i, _len, _ref;
    query = req.body.query;
    tag = req.body.tag;
    if (songs === void 0 || songs.length <= 0) {
      fs.readFile(out_file, "utf8", "w", function(err, in_file) {
        var s, _i, _len, _ref, _results;
        if (err) {
          throw err;
        }
        if (!err) {
          songs = JSON.parse(in_file);
        }
        _ref = songs[0].data;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          if (s.query === query && s[tag] !== void 0) {
            _results.push(s[tag]++);
          } else {
            _results.push(s[tag] = 1);
          }
        }
        return _results;
      });
    } else {
      _ref = songs[0].data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        if (s.query === query && s[tag] !== void 0) {
          s[tag]++;
        } else {
          s[tag] = 1;
        }
      }
      fs.writeFile(out_file, JSON.stringify(songs), function(err) {
        if (err) {
          throw err;
        }
        console.log("JSON saved to " + out_file);
      });
      res.send(songs);
    }
  });

  app.get("/today", function(req, res) {
    if (songs.length <= 0) {
      console.log("sending from JSON: " + out_file);
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
      console.log("sending existing from memory");
      return res.send(songs[0].data);
    }
  });

  server = app.listen(3000, function() {
    var host, port;
    host = server.address().address;
    port = server.address().port;
    return console.log("App listening at http://" + host + ":" + port);
  });

}).call(this);
