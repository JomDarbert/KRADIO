(function() {
  var blacklist, client_id, eyk, hangul, hangul_chars, mwave, query_start_date, song, today, top_queries, whitelist, _i, _j, _len, _len1,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  client_id = "2721807f620a4047d473472d46865f14";

  SC.initialize({
    client_id: client_id
  });

  today = moment().format("YYYY-MM-DD HH:MM:SS");

  query_start_date = moment().subtract(12, 'months').format("YYYY-MM-DD HH:MM:SS");

  whitelist = ["kpop", "k pop", "k-pop", "korean", "korea"];

  blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "cvr"];

  hangul_chars = "[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|" + "\uD7B0-\uD7FF]";

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

  for (_i = 0, _len = eyk.length; _i < _len; _i++) {
    song = eyk[_i];
    top_queries.push(song.title);
  }

  for (_j = 0, _len1 = mwave.length; _j < _len1; _j++) {
    song = mwave[_j];
    top_queries.push(song.artist + " " + song.title);
  }

  (function() {
    var processTracks, query, _k, _len2, _results;
    processTracks = function(tracks) {
      var trackArray;
      trackArray = [];
      tracks.forEach(function(track) {
        var created, genre, tags, title;
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
          created = moment(track.created_at);
        }
        if (__indexOf.call(whitelist, genre) >= 0) {
          console.log(title, genre);
        }
        trackArray.push(song);
      });
    };
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
