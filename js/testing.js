(function() {
  var blacklist, checkBlacklist, checkWhitelist, client_id, english, english_chars, eyk, hangul, hangul_chars, mwave, processTracks, song, top_queries, whitelist, _i, _j, _len, _len1,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  client_id = "2721807f620a4047d473472d46865f14";

  SC.initialize({
    client_id: client_id
  });

  whitelist = ["kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "original"];

  blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient", "meditat"];

  hangul_chars = "[^\u1100-\u11FF|^\u3130-\u318F|^\uA960-\uA97F|^\uAC00-\uD7AF|^\uD7B0-\uD7FF]";

  english_chars = "[]";

  english = new RegExp(english_chars);

  hangul = new RegExp(hangul_chars);

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

  top_queries = [];

  console.log(hangul.test("안녕 name 안녕[]."));

  for (_i = 0, _len = eyk.length; _i < _len; _i++) {
    song = eyk[_i];
    top_queries.push(song.title);
  }

  for (_j = 0, _len1 = mwave.length; _j < _len1; _j++) {
    song = mwave[_j];
    top_queries.push(song.artist + " " + song.title);
  }

  checkBlacklist = function(song) {
    var created_date, date_limit, ok_months, term, _k, _l, _len2, _len3, _len4, _m;
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
    return true;
  };

  checkWhitelist = function(song) {
    var points, _ref;
    points = 0;
    if (_ref = song.genre, __indexOf.call(whitelist, _ref) >= 0) {
      return points += 1;
    }
  };

  processTracks = function(tracks) {
    var songArray, _k, _len2;
    songArray = [];
    tracks.forEach(function(track) {
      var artwork, blacklist_pass, created, genre, songObj, tags, title, url;
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
      songObj = {
        title: title,
        genre: genre,
        tags: tags,
        created: created,
        url: url,
        artwork: artwork
      };
      blacklist_pass = checkBlacklist(songObj);

      /*
      
      for tag in tags when tag in whitelist
        points += 1
       */
    });
    for (_k = 0, _len2 = songArray.length; _k < _len2; _k++) {
      song = songArray[_k];
      console.log(song);
    }
  };

  (function() {
    var query, _k, _len2, _results;
    SC.initialize({
      client_id: client_id
    });
    _results = [];
    for (_k = 0, _len2 = top_queries.length; _k < _len2; _k++) {
      query = top_queries[_k];
      _results.push(SC.get("/tracks", {
        q: query,
        limit: 200
      }, processTracks));
    }
    return _results;
  })();

}).call(this);
