(function() {
  var UrlExists, addToHistory, blacklist, checkBlacklist, checkWhitelist, choosePlayer, client_id, comb, cookie_dontPlay, dontPlay, getCookie, getSongJSON, has_korean, history, loadSong, nextSong, notAvailable, not_kor_eng, only_korean, player, player_five, player_four, player_one, player_three, player_two, players, processSong, queryLimit, randomQuery, setPlayerAttributes, song, song_data, top_queries, whitelist, xStart, yStart, _i, _j, _k, _len, _len1, _len2,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  client_id = "2721807f620a4047d473472d46865f14";


  /*
  lastfm = new LastFM(
    apiKey: "c04e77b276f955f8ed3a94006abb8c42"
    apiSecret: "69b6345d1e154c9b60f0b32b85268dad"
  )
   */

  SC.initialize({
    client_id: client_id
  });

  queryLimit = 100;

  whitelist = ["kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "original"];

  blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient", "meditat", "short", "club"];

  not_kor_eng = /[^A-Za-z0-9\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF \♡\.\「\」\”\“\’\∞\♥\|\【\】\–\{\}\[\]\!\@\#\$\%\^\&\*\(\)\-\_\=\+\;\:\'\"\,\.\<\>\/\\\?\`\~]/g;

  has_korean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g;

  only_korean = /[^\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g;

  history = [];

  notAvailable = [];

  getCookie = function(name) {
    var re, value;
    re = new RegExp(name + "=([^;]+)");
    value = re.exec(document.cookie);
    if ((value != null)) {
      return unescape(value[1]);
    } else {
      return null;
    }
  };

  cookie_dontPlay = getCookie("dontPlay");

  if (cookie_dontPlay !== null) {
    dontPlay = JSON.parse(cookie_dontPlay);
  } else {
    dontPlay = [];
  }

  player_one = document.getElementById("player_one");

  player_two = document.getElementById("player_two");

  player_three = document.getElementById("player_three");

  player_four = document.getElementById("player_four");

  player_five = document.getElementById("player_five");

  players = [player_one, player_two, player_three, player_four, player_five];

  getSongJSON = function() {
    var xmlHttp;
    xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "http://jombly.com:3000/today", false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
  };

  song_data = JSON.parse(getSongJSON());

  top_queries = arrayUnique(song_data);

  top_queries = top_queries.filter(function(z) {
    return dontPlay.indexOf(z.query) < 0;
  });

  Number.prototype.toHHMMSS = function() {
    var h, m, s;
    h = Math.floor(this / 3600);
    m = Math.floor(this % 3600 / 60);
    s = Math.floor(this % 3600 % 60);
    return (h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s;
  };

  UrlExists = function(url, cb) {
    jQuery.ajax({
      url: url,
      dataType: "text",
      type: "GET",
      complete: function(xhr) {
        if (typeof cb === "function") {
          cb.apply(this, [xhr.status]);
        }
      }
    });
  };

  checkBlacklist = function(song, query) {
    var arrays, cleaned_query, cleaned_song, created_date, date_limit, kor_eng_test, ok_months, query_array, result, song_array, term, _i, _j, _k, _len, _len1, _len2;
    if (song.orig_title == null) {
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
    if (song.duration > 360) {
      return false;
    }
    for (_i = 0, _len = blacklist.length; _i < _len; _i++) {
      term = blacklist[_i];
      if (song.orig_title.indexOf(term) !== -1) {
        return false;
      }
    }
    for (_j = 0, _len1 = blacklist.length; _j < _len1; _j++) {
      term = blacklist[_j];
      if ((song.genre != null) && song.genre.indexOf(term) !== -1) {
        return false;
      }
    }
    for (_k = 0, _len2 = blacklist.length; _k < _len2; _k++) {
      term = blacklist[_k];
      if (__indexOf.call(song.tags, term) >= 0) {
        return false;
      }
    }
    kor_eng_test = not_kor_eng.test(song.orig_title);
    if (kor_eng_test === true) {
      return false;
    }
    cleaned_song = song.orig_title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
    cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
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
    if (result.length === 0) {
      return false;
    }
    if (levenstein(cleaned_query, cleaned_song) >= 8) {
      return false;
    }
    return true;
  };

  checkWhitelist = function(song, query) {
    var arrays, cleaned_query, cleaned_song, query_array, query_count, result, score, song_array, tags_count, term, test, _i, _len, _ref;
    score = 0;
    tags_count = 0;
    query_count = 0;
    cleaned_song = song.orig_title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
    cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
    if (_ref = song.genre, __indexOf.call(whitelist, _ref) >= 0) {
      score += 1;
    }
    for (_i = 0, _len = whitelist.length; _i < _len; _i++) {
      term = whitelist[_i];
      if (__indexOf.call(song.tags, term) >= 0) {
        tags_count += 1;
      }
    }
    if (tags_count > 0) {
      score += 1;
    }
    test = has_korean.test(song.orig_title);
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
    if (levenstein(cleaned_query, cleaned_song) <= 5) {
      score += 1;
    }
    return score;
  };

  loadSong = function(q) {

    /*
    get purchase links from lastfm
    lastfm.track.getBuylinks({artist: q.artist, track: q.title, country: 'US'}
    , success: (data) ->
      buyLinks = data.affiliations.downloads.affiliation
    , error: (code, message) ->
      console.log code,message
    )
     */
    var dfd;
    dfd = $.Deferred();
    SC.get('/tracks', {
      q: q.query,
      limit: queryLimit
    }, function(tracks, err) {
      var acceptable;
      if ((tracks == null) || tracks.length === 0 || err !== null) {
        dfd.reject();
        return;
      } else {
        acceptable = [];
        tracks.forEach(function(t) {
          var artwork, blacklist_pass, created, duration, genre, korean, song, tags, test, url, views;
          test = has_korean.test(t.title);
          if ((t.title != null) && test === true) {
            korean = "(" + (t.title.toLowerCase().replace(only_korean, "")) + ")";
          } else {
            korean = "";
          }
          if (t.genre != null) {
            genre = t.genre.toLowerCase();
          }
          if (t.tag_list != null) {
            tags = t.tag_list.toLowerCase().split(" ");
          }
          if (t.created_at != null) {
            created = t.created_at;
          }
          if (t.stream_url != null) {
            url = t.stream_url + "?client_id=" + client_id;
          }
          if (t.artwork_url != null) {
            artwork = t.artwork_url.replace("-large", "-t500x500");
          }
          if (t.playback_count != null) {
            views = t.playback_count;
          }
          if (t.duration != null) {
            duration = t.duration / 1000;
          }
          song = {
            title: "" + q.artist + "  —  " + q.title + " " + korean,
            orig_title: t.title,
            song: q.title,
            artist: q.artist,
            rank: q.rank,
            num_days: q.num_days,
            change: q.change,
            korean: korean,
            genre: genre,
            tags: tags,
            created: created,
            url: url,
            artwork: artwork,
            duration: duration,
            views: views,
            score: 0,
            query: q.query
          };
          blacklist_pass = checkBlacklist(song, q.query);
          song.score = checkWhitelist(song, q.query);
          if (blacklist_pass === true && song.score >= 2) {
            return acceptable.push(song);
          }
        });
        acceptable.sort(function(x, y) {
          var n;
          n = y.score - x.score;
          if (n !== 0) {
            return n;
          }
          return y.views - x.views;
        });
        if (acceptable.length > 0) {
          dfd.resolve(acceptable[0]);
        } else {
          dfd.reject();
        }
      }
    });
    return dfd.promise();
  };

  addToHistory = function(song) {
    var len, max;
    len = history.length;
    max = 19;
    if (song.query != null) {
      history.unshift(song.query);
    }
    if (len > max) {
      history.splice(max + 1, len - max);
    }
  };

  randomQuery = function() {
    var availableSongs;
    availableSongs = top_queries.filter(function(x) {
      return history.indexOf(x.query) < 0;
    });
    availableSongs = availableSongs.filter(function(y) {
      return notAvailable.indexOf(y.query) < 0;
    });
    availableSongs = availableSongs.filter(function(z) {
      return dontPlay.indexOf(z.query) < 0;
    });
    return availableSongs[Math.floor(Math.random() * availableSongs.length)];
  };

  processSong = function(query) {
    var dfd, request;
    request = function(query) {
      return loadSong(query).done(function(song) {
        addToHistory(song);
        return dfd.resolve(song);
      }).fail(function() {
        var newQ;
        notAvailable.push(query);
        newQ = randomQuery();
        return request(newQ);
      });
    };
    dfd = $.Deferred();
    request(query);
    return dfd.promise();
  };

  choosePlayer = function() {
    var a, c, len, n, o, othr, otwo, seq;
    players = [player_one, player_two, player_three, player_four, player_five];
    c = players.indexOf(document.getElementsByClassName("active")[0]);
    len = players.length - 1;
    if ((c == null) || c === len) {
      a = 0;
    } else {
      a = c + 1;
    }
    if (a === len) {
      n = 0;
    } else {
      n = a + 1;
    }
    if (n === len) {
      o = 0;
    } else {
      o = n + 1;
    }
    if (o === len) {
      otwo = 0;
    } else {
      otwo = o + 1;
    }
    if (otwo === len) {
      othr = 0;
    } else {
      othr = otwo + 1;
    }
    seq = {
      active: players[a],
      next: players[n],
      onDeck: players[o],
      onDeckTwo: players[otwo],
      onDeckThree: players[othr],
      last: players[c]
    };
    seq.active.classList.add("active");
    seq.next.classList.remove("active");
    seq.onDeck.classList.remove("active");
    seq.onDeckTwo.classList.remove("active");
    seq.onDeckThree.classList.remove("active");
    return seq;
  };

  setPlayerAttributes = function(player, song) {
    var source;
    source = player.getElementsByTagName("SOURCE")[0];
    source.setAttribute("src", song.url);
    player.setAttribute("artwork", song.artwork);
    player.setAttribute("songtitle", song.title);
    player.setAttribute("songlength", song.duration);
    player.setAttribute("rank", song.rank);
    player.setAttribute("change", song.change);
    player.setAttribute("num_days", song.num_days);
    player.setAttribute("query", song.query);
    return player.load();
  };

  nextSong = function() {
    var art, change, endTime, max, num_days, query, rank, source, title, url;
    players = choosePlayer();
    source = players.active.getElementsByTagName("SOURCE")[0];
    query = randomQuery();
    endTime = Number(players.active.getAttribute("songlength")).toHHMMSS();
    art = players.active.getAttribute("artwork");
    title = players.active.getAttribute("songtitle");
    max = players.active.getAttribute("songlength");
    url = source.getAttribute("src");
    rank = players.active.getAttribute("rank");
    change = players.active.getAttribute("change");
    num_days = players.active.getAttribute("num_days");
    UrlExists(url, function(status) {
      if (status === 404 || status === 503) {
        nextSong();
      }
    });
    UrlExists(art, function(status) {
      if (status === 404 || status === 503) {
        nextSong();
      }
    });
    players.last.pause();
    players.active.play();
    if ((endTime != null) && endTime !== void 0) {
      $('#endTime').val(endTime);
    }
    if ((max != null) && max !== void 0) {
      $('#seek').attr("max", max);
    }
    if ((title != null) && title !== void 0) {
      $('#title').text(title);
    }
    if ((art != null) && art !== void 0) {
      $('#container').css("background", "url(" + art + ") no-repeat center center");
    }
    $('#title').text(title);
    document.title = title;
    $('#rank').text("Rank " + rank);
    if (change < 0) {
      $('#change').css("color", "#D7431B");
      $('#change').text("( " + change + " )");
    }
    if (change > 0) {
      $('#change').css("color", "#288668");
      $('#change').text("( +" + change + " )");
    }
    if (change === 0) {
      $('#change').css("color", "#2d3033");
      $('#change').text("( — )");
    }
    $('#daysOnChart').text("" + num_days + " days on chart");
    $('#recentSongs').prepend("<li>" + (players.last.getAttribute("songtitle")) + "</li><button class='removeThumb'>&#xf00d;</button>");
    processSong(query).done(function(result) {
      return setPlayerAttributes(players.last, result);
    });
  };

  document.addEventListener("touchmove", function(event) {
    if (event.target.tagName !== "INPUT") {
      return event.preventDefault();
    }
  });

  xStart = void 0;

  yStart = 0;

  document.addEventListener("touchstart", function(e) {
    xStart = e.touches[0].screenX;
    yStart = e.touches[0].screenY;
  });

  document.addEventListener("touchmove", function(e) {
    var xMovement, yMovement;
    xMovement = Math.abs(e.touches[0].screenX - xStart);
    yMovement = Math.abs(e.touches[0].screenY - yStart);
    if ((yMovement * 3) > xMovement) {
      e.preventDefault();
    }
  });

  $('#nextButton').on("click", function() {
    return nextSong();
  });

  $('#playButton').on("click", function() {
    var p;
    p = document.getElementsByClassName("active")[0];
    if (p.paused) {
      $('#playButton').html("&#xf04c;");
      return p.play();
    } else {
      $('#playButton').html("&#xf04b;");
      return p.pause();
    }
  });

  for (_i = 0, _len = players.length; _i < _len; _i++) {
    player = players[_i];
    player.volume = 0.5;
    player.oncanplay = function() {
      var p, reloadAt;
      p = this;
      reloadAt = (this.duration + 30) * 1000;
      return setTimeout((function() {
        var query;
        if (p.paused) {
          query = randomQuery();
          processSong(query).done(function(result) {
            return setPlayerAttributes(p, result);
          });
        }
      }), reloadAt);
    };
    player.onerror = function() {
      return nextSong();
    };
    player.onplaying = function() {
      return $('#playButton').html("&#xf04c;");
    };
    player.onended = function() {
      return nextSong();
    };
    player.ontimeupdate = function() {
      $('#currentTime').val(this.currentTime.toHHMMSS());
      return $('#seek').val(this.currentTime);
    };
  }

  $('#seek').on("input", function() {
    var c;
    c = document.getElementsByClassName("active")[0];
    c.pause();
    return c.currentTime = this.value;
  });

  $('#seek').on("change", function() {
    var c;
    c = document.getElementsByClassName("active")[0];
    return c.play();
  });

  $('#volume').on("input change", function() {
    player_one.volume = this.value;
    player_two.volume = this.value;
    player_three.volume = this.value;
    player_four.volume = this.value;
    return player_five.volume = this.value;
  });

  $('#dontPlay').on("click", function() {
    var c, query, title;
    c = document.getElementsByClassName("active")[0];
    query = c.getAttribute("query");
    title = c.getAttribute("songtitle");
    dontPlay.push(query);
    document.cookie = "dontPlay=" + JSON.stringify(dontPlay);
    $('#thumbsDownSongs').prepend("<li>" + title + "</li>");
    return nextSong();
  });

  $('#showOverlay').on("click", function() {
    $('#overlay').toggleClass("hidden");
    return $('#container').toggleClass("hidden");
  });

  for (_j = 0, _len1 = dontPlay.length; _j < _len1; _j++) {
    song = dontPlay[_j];
    $('#thumbsDownSongs').prepend("<li>" + song + "</li>");
  }

  for (_k = 0, _len2 = top_queries.length; _k < _len2; _k++) {
    song = top_queries[_k];
    comb = "" + song.artist + " - " + song.title;
    $('#topList').append("<li>" + comb + "</li>");
  }

  $(document).ready(function() {
    var q_five, q_four, q_one, q_three, q_two;
    q_one = randomQuery();
    q_two = randomQuery();
    q_three = randomQuery();
    q_four = randomQuery();
    q_five = randomQuery();
    processSong(q_one).done(function(res_one) {
      setPlayerAttributes(player_one, res_one);
      UrlExists(res_one.url, function(status) {
        if (status === 404 || status === 503) {
          nextSong();
        }
      });
      UrlExists(res_one.artwork, function(status) {
        if (status === 404 || status === 503) {
          nextSong();
        }
      });
      if (res_one.duration != null) {
        $('#endTime').val(res_one.duration.toHHMMSS());
        $('#seek').attr("max", res_one.duration);
      }
      if (res_one.artwork != null) {
        $('#container').css("background", "url(" + res_one.artwork + ") no-repeat center center");
      }
      $('#title').text(res_one.title);
      $('#rank').text("Rank " + res_one.rank);
      if (res_one.change < 0) {
        $('#change').css("color", "#D7431B");
        $('#change').text("( " + res_one.change + " )");
      }
      if (res_one.change > 0) {
        $('#change').css("color", "#288668");
        $('#change').text("( +" + res_one.change + " )");
      }
      if (res_one.change === 0) {
        $('#change').css("color", "#2d3033");
        $('#change').text("( — )");
      }
      return $('#daysOnChart').text("" + res_one.num_days + " days on chart");
    });
    processSong(q_two).done(function(res_two) {
      return setPlayerAttributes(player_two, res_two);
    });
    processSong(q_three).done(function(res_three) {
      return setPlayerAttributes(player_three, res_three);
    });
    processSong(q_four).done(function(res_four) {
      return setPlayerAttributes(player_four, res_four);
    });
    return processSong(q_five).done(function(res_five) {
      return setPlayerAttributes(player_five, res_five);
    });
  });

}).call(this);
