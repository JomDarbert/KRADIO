(function() {
  var CronJob, cheerio, fs, get_data, http, out_file, pages, request, songs, update_data;

  http = require("http");

  request = require("request");

  cheerio = require("cheerio");

  fs = require("fs");

  CronJob = require('cron').CronJob;

  songs = [];

  out_file = "songs.json";

  pages = ["http://www.eatyourkimchi.com/kpopcharts/", "http://www.eatyourkimchi.com/kpopcharts/page/2/", "http://www.eatyourkimchi.com/kpopcharts/page/3/", "http://www.eatyourkimchi.com/kpopcharts/page/4/", "http://www.eatyourkimchi.com/kpopcharts/page/5/", "http://www.eatyourkimchi.com/kpopcharts/page/6/", "http://www.eatyourkimchi.com/kpopcharts/page/7/", "http://www.eatyourkimchi.com/kpopcharts/page/8/", "http://www.eatyourkimchi.com/kpopcharts/page/9/", "http://www.eatyourkimchi.com/kpopcharts/page/10/", "http://mwave.interest.me/kpop/chart.m"];

  get_data = function(urls, callback) {
    var count, page, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = urls.length; _i < _len; _i++) {
      page = urls[_i];
      count = 0;
      _results.push(request(page, function(error, response, html) {
        var $, parsedResults;
        if (!error && response.statusCode === 200) {
          $ = cheerio.load(html);
          parsedResults = [];
          $("div.list_song tr").each(function(i, element) {
            var artist, mwave, query, rank, title;
            artist = $(this).find(".tit_artist a:first-child").text().replace("(", "").replace(")", "").replace("'", "");
            title = $(this).find(".tit_song a").text().replace("(", "").replace(")", "").replace("'", "");
            rank = $(this).find(".nb em").text();
            query = artist + " " + title;
            if ((artist != null) && artist !== "") {
              mwave = {
                artist: artist,
                title: title,
                query: query.toLowerCase(),
                rank: rank
              };
              parsedResults.push(mwave);
            }
          });
          songs.push(parsedResults);
        }
      }).on("end", function() {
        var i, len, merged;
        count++;
        if (count === pages.length) {
          merged = [];
          merged = merged.concat.apply(merged, songs);
          i = 0;
          len = merged.length;
          while (i < len) {
            merged[i] && merged.push(merged[i]);
            i++;
          }
          merged.splice(0, len);
          return callback(merged);
        }
      }));
    }
    return _results;
  };

  update_data = function() {
    return get_data(pages, function(data) {
      var key, song, _i, _len;
      console.log(data);
      for (key = _i = 0, _len = data.length; _i < _len; key = ++_i) {
        song = data[key];
        song.rank = key + 1;
        song.change = 0;
        song.num_days = 0;
      }
      return fs.writeFile(out_file, JSON.stringify(data), function(err) {
        if (err) {
          throw err;
        }
        console.log("JSON saved to " + out_file);
        return;
        return request.post({
          url: "http://jombly.com:3000/update",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json;charset=UTF-8"
          }
        }, function(error, response, body) {
          console.log(error);
          console.log(response.statusCode);
          console.log(body);
        });
      });
    });
  };

  update_data();

}).call(this);
