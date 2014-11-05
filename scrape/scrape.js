var CronJob, cheerio, fs, get_data, out_file, pages, request, songs, update_data;

request = require("request");

cheerio = require("cheerio");

fs = require("fs");

CronJob = require('cron').CronJob;


/*
d = new Date()
date = d.getDate()
month = d.getMonth()
year = d.getFullYear()
 */

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
        $("div.bkp-listing").each(function(i, element) {
          var artist, content, eyk, query, rank, title;
          content = $(this).find("h2.bkp-toggle-vid").text().replace("(", "").replace(")", "").replace("'", "").split(" – ");
          artist = content[0];
          title = content[1];
          query = artist + " " + title;
          rank = $(this).find("span.bkp-vid-rank").text();
          eyk = {
            artist: artist,
            title: title,
            query: query.toLowerCase(),
            rank: rank
          };
          parsedResults.push(eyk);
        });
        $("div.list_song tr").each(function(i, element) {
          var artist, mwave, query, rank, title;
          artist = $(this).find(".tit_artist a:first-child").text().replace("(", "").replace(")", "").replace("'", "");
          title = $(this).find(".tit_song a").text().replace("(", "").replace(")", "").replace("'", "");
          rank = $(this).find(".nb em").text();
          query = artist + " " + title;
          mwave = {
            artist: artist,
            title: title,
            query: query.toLowerCase(),
            rank: rank
          };
          parsedResults.push(mwave);
        });
        songs.push(parsedResults);
      }
    }).on("end", function() {
      var merged;
      count++;
      if (count === pages.length) {
        merged = [];
        merged = merged.concat.apply(merged, songs);
        return callback(merged);
      }
    }));
  }
  return _results;
};

update_data = function() {
  return get_data(pages, function(data) {
    return fs.readFile(out_file, "utf8", "w", function(err, in_file) {
      var compare, entry, key, list, song, _i, _len, _ref;
      if (err) {
        list = [];
      } else {
        list = JSON.parse(in_file);
      }
      entry = {
        date: new Date(),
        data: data
      };
      list.unshift(entry);
      if (list.length > 100) {
        list.splice(list.length, 1);
      }
      compare = function(a, b) {
        var ar, br;
        ar = Number(a.rank);
        br = Number(b.rank);
        if (ar < br) {
          return -1;
        }
        if (ar > br) {
          return 1;
        }
        return 0;
      };
      list[0].data.sort(compare);
      _ref = list[0].data;
      for (key = _i = 0, _len = _ref.length; _i < _len; key = ++_i) {
        song = _ref[key];
        song.rank = key + 1;
      }
      return fs.writeFile(out_file, JSON.stringify(list), function(err) {
        if (err) {
          throw err;
        }
        console.log("JSON saved to " + out_file);
      });
    });
  });
};

update_data();


/*
new CronJob("0 0,12 * * *", ->

, null, true)
 */
