(function() {
  var arrayUnique, blacklist, checkBlacklist, checkWhitelist, client_id, countSongs, eyk, getRandomSong, has_korean, mwave, not_kor_eng, query, song, top_queries, whitelist, _i, _j, _k, _len, _len1, _len2,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  client_id = "2721807f620a4047d473472d46865f14";

  SC.initialize({
    client_id: client_id
  });

  whitelist = ["kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "original"];

  blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient", "meditat"];

  not_kor_eng = /[^A-Za-z0-9\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF \♡\.\「\」\”\“\’\∞\♥\|\【\】\–\{\}\[\]\!\@\#\$\%\^\&\*\(\)\-\_\=\+\;\:\'\"\,\.\<\>\/\\\?\`\~]/g;

  has_korean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g;

  eyk = (function() {
    var json;
    json = null;
    $.ajax({
      async: false,
      global: false,
      url: "../scrape/EYK/tutorial/eyk.json",
      dataType: "json",
      success: function(data) {
        json = data;
      }
    });
    return json;
  })();

  mwave = (function() {
    var json;
    json = null;
    $.ajax({
      async: false,
      global: false,
      url: "../scrape/MWAVE/tutorial/mwave.json",
      dataType: "json",
      success: function(data) {
        json = data;
      }
    });
    return json;
  })();

  arrayUnique = function(array) {
    var a, i, j;
    a = array.concat();
    i = 0;
    while (i < a.length) {
      j = i + 1;
      while (j < a.length) {
        if (a[i] === a[j]) {
          a.splice(j--, 1);
        }
        ++j;
      }
      ++i;
    }
    return a;
  };

  top_queries = [];

  for (_i = 0, _len = eyk.length; _i < _len; _i++) {
    song = eyk[_i];
    top_queries.push(song.title);
  }

  for (_j = 0, _len1 = mwave.length; _j < _len1; _j++) {
    song = mwave[_j];
    top_queries.push(song.artist + " " + song.title);
  }

  top_queries = arrayUnique(top_queries);

  console.log(top_queries);

  checkBlacklist = function(song) {
    var created_date, date_limit, kor_eng_test, ok_months, term, _k, _l, _len2, _len3, _len4, _m;
    if (song.title == null) {
      return false;
    }
    if (song.url == null) {
      return false;
    }
    if (song.created == null) {
      return false;
    }
    ok_months = 12;
    created_date = moment(song.created, "YYYY-MM-DD HH:MM:SS");
    date_limit = moment().subtract(ok_months, "months");
    if (date_limit.diff(created_date, "months") > 0) {
      return false;
    }
    for (_k = 0, _len2 = blacklist.length; _k < _len2; _k++) {
      term = blacklist[_k];
      if (song.title.indexOf(term) !== -1) {
        return false;
      }
    }
    for (_l = 0, _len3 = blacklist.length; _l < _len3; _l++) {
      term = blacklist[_l];
      if ((song.genre != null) && song.genre.indexOf(term) !== -1) {
        return false;
      }
    }
    for (_m = 0, _len4 = blacklist.length; _m < _len4; _m++) {
      term = blacklist[_m];
      if (__indexOf.call(song.tags, term) >= 0) {
        return false;
      }
    }
    kor_eng_test = not_kor_eng.test(song.title);
    if (kor_eng_test === true) {
      return false;
    }
    return true;
  };

  checkWhitelist = function(song, query) {
    var arrays, cleaned_query, cleaned_song, query_array, query_count, result, score, song_array, tags_count, term, test, _k, _len2, _ref;
    score = 0;
    tags_count = 0;
    query_count = 0;
    cleaned_song = song.title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
    cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
    if (_ref = song.genre, __indexOf.call(whitelist, _ref) >= 0) {
      score += 1;
    }
    for (_k = 0, _len2 = whitelist.length; _k < _len2; _k++) {
      term = whitelist[_k];
      if (__indexOf.call(song.tags, term) >= 0) {
        tags_count += 1;
      }
    }
    if (tags_count > 0) {
      score += 1;
    }
    test = has_korean.test(song.title);
    if (test === true) {
      score += 1;
    }
    song_array = cleaned_song.split(" ");
    query_array = cleaned_query.split(" ");
    arrays = [song_array, query_array];
    result = arrays.shift().reduce(function(res, v) {
      if (res.indexOf(v) === -1 && arrays.every(function(a) {
        return a.indexOf(v) !== -1;
      })) {
        res.push(v);
      }
      return res;
    }, []);
    if (result.length === query_array.length) {
      score += 1;
    }
    if (levenstein(cleaned_query, cleaned_song) <= 10) {
      score += 1;
    }
    return score;
  };

  getRandomSong = function(query) {
    var dfd;
    dfd = $.Deferred();
    SC.get('/tracks', {
      q: query,
      limit: 200
    }, function(tracks) {
      var finalists;
      finalists = [];
      tracks.forEach(function(track) {
        var artwork, blacklist_pass, created, duration, genre, tags, title, url, views;
        if (track.title != null) {
          title = track.title.toLowerCase();
        }
        if (track.genre != null) {
          genre = track.genre.toLowerCase();
        }
        if (track.tag_list != null) {
          tags = track.tag_list.toLowerCase().split(" ");
        }
        if (track.created_at != null) {
          created = track.created_at;
        }
        if (track.stream_url != null) {
          url = track.stream_url;
        }
        if (track.artwork_url != null) {
          artwork = track.artwork_url.replace("-large", "-t500x500");
        }
        if (track.playback_count != null) {
          views = track.playback_count;
        }
        if (track.duration != null) {
          duration = track.duration / 1000;
        }
        song = {
          title: title,
          genre: genre,
          tags: tags,
          created: created,
          url: url,
          artwork: artwork,
          duration: duration,
          views: views,
          score: 0,
          query: query
        };
        blacklist_pass = checkBlacklist(song);
        song.score = checkWhitelist(song, query);
        if (blacklist_pass === true && song.score >= 2) {
          return finalists.push(song);
        }
      });
      finalists.sort(function(x, y) {
        var n;
        n = y.score - x.score;
        if (n !== 0) {
          return n;
        }
        return y.views - x.views;
      });
      if (finalists.length > 0) {
        dfd.resolve(finalists[0]);
      } else {
        dfd.resolve(false);
      }
    });
    return dfd.promise();
  };

  countSongs = 0;

  SC.initialize({
    client_id: client_id
  });

  for (_k = 0, _len2 = top_queries.length; _k < _len2; _k++) {
    query = top_queries[_k];
    getRandomSong(query).done(function(arr) {
      if (arr !== false) {
        countSongs += 1;
      }
      return console.log(countSongs);
    });
  }

}).call(this);
