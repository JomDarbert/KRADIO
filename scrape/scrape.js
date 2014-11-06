var CronJob, cheerio, fs, get_data, levenstein, out_file, pages, request, songs, sortQuery, sortRank, update_data;

request = require("request");

cheerio = require("cheerio");

fs = require("fs");

CronJob = require('cron').CronJob;

songs = [];

out_file = "songs.json";

pages = ["http://www.eatyourkimchi.com/kpopcharts/", "http://www.eatyourkimchi.com/kpopcharts/page/2/", "http://www.eatyourkimchi.com/kpopcharts/page/3/", "http://www.eatyourkimchi.com/kpopcharts/page/4/", "http://www.eatyourkimchi.com/kpopcharts/page/5/", "http://www.eatyourkimchi.com/kpopcharts/page/6/", "http://www.eatyourkimchi.com/kpopcharts/page/7/", "http://www.eatyourkimchi.com/kpopcharts/page/8/", "http://www.eatyourkimchi.com/kpopcharts/page/9/", "http://www.eatyourkimchi.com/kpopcharts/page/10/", "http://mwave.interest.me/kpop/chart.m"];

levenstein = (function() {
  var row2;
  row2 = [];
  return function(s1, s2) {
    var a, b, c, c2, i1, i2, row, s1_len, s2_len;
    if (s1 === s2) {
      return 0;
    } else {
      s1_len = s1.length;
      s2_len = s2.length;
      if (s1_len && s2_len) {
        i1 = 0;
        i2 = 0;
        a = void 0;
        b = void 0;
        c = void 0;
        c2 = void 0;
        row = row2;
        while (i1 < s1_len) {
          row[i1] = ++i1;
        }
        while (i2 < s2_len) {
          c2 = s2.charCodeAt(i2);
          a = i2;
          ++i2;
          b = i2;
          i1 = 0;
          while (i1 < s1_len) {
            c = a + (s1.charCodeAt(i1) !== c2 ? 1 : 0);
            a = row[i1];
            b = (b < a ? (b < c ? b + 1 : c) : (a < c ? a + 1 : c));
            row[i1] = b;
            ++i1;
          }
        }
        return b;
      } else {
        return s1_len + s2_len;
      }
    }
  };
})();

sortQuery = function(a, b) {
  var aq, bq;
  aq = a.query;
  bq = b.query;
  if (aq < bq) {
    return -1;
  }
  if (aq > bq) {
    return 1;
  }
  return 0;
};

sortRank = function(a, b) {
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
    var a, i, key, lev, prev, song, to_file, _i, _len;
    data.sort(sortQuery);
    a = [];
    prev = "";
    i = 0;
    while (i < data.length) {
      lev = levenstein(data[i].query, prev.query || "");
      if (lev > 6) {
        a.push(data[i]);
      }
      prev = data[i];
      i++;
    }
    to_file = a;
    to_file.sort(sortRank);
    for (key = _i = 0, _len = to_file.length; _i < _len; key = ++_i) {
      song = to_file[key];
      song.rank = key + 1;
      song.change = 0;
      song.num_days = 0;
    }
    return fs.readFile(out_file, "utf8", "w", function(err, in_file) {
      var count, entry, item, list, old, _j, _k, _l, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
      if (err) {
        list = [];
      } else {
        list = JSON.parse(in_file);
      }
      entry = {
        date: new Date,
        data: to_file
      };
      list.unshift(entry);
      if (list.length > 100) {
        list.pop;
      }
      if (list.length > 1) {
        _ref = list[0].data;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          song = _ref[_j];
          count = 0;
          if (list.length >= 7) {
            _ref1 = list[6].data;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
              old = _ref1[_k];
              if (old.query === song.query) {
                song.change = old.rank - song.rank;
              }
            }
          }
          for (_l = 0, _len3 = list.length; _l < _len3; _l++) {
            entry = list[_l];
            _ref2 = entry.data;
            for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
              item = _ref2[_m];
              if (item.query === song.query) {
                count++;
              }
            }
          }
          song.num_days = count;
        }
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

new CronJob("0 0 * * *", function() {
  return update_data();
}, null, true);
