
/*
Auto-scraping
http://stackoverflow.com/questions/4138251/preload-html5-audio-while-it-is-playing
http://stackoverflow.com/questions/7779697/javascript-asynchronous-return-value-assignment-with-jquery
 */

(function() {
  var client_id, currentTime, endTime, exclude_tags, failed, getActivePlayer, getRandomSong, getReadyPlayer, getTimeFromSecs, hangul, hangul_chars, logEvent, nextButton, pad, playButton, playNext, player, player_five, player_four, player_one, player_three, player_two, preparePlayer, priority_tags, seek, setActivePlayer, song_title, top_queries, _i, _len, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  client_id = "2721807f620a4047d473472d46865f14";

  priority_tags = ["kpop", "k pop", "k-pop", "korean", "korea"];

  exclude_tags = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "cvr"];

  hangul_chars = "[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|" + "\uD7B0-\uD7FF]";

  hangul = new RegExp(hangul_chars);

  top_queries = ["Madtown YOLO", "VIXX Error", "BTOB You're so fly", "PSY Hangover", "Boyfriend Witch", "Raina You End And Me", "Song Ji Eun Don't look at me like that", "Ailee Don't touch me"];

  player_one = document.getElementById("player_one");

  player_two = document.getElementById("player_two");

  player_three = document.getElementById("player_three");

  player_four = document.getElementById("player_four");

  player_five = document.getElementById("player_five");

  song_title = document.getElementById("title");

  playButton = document.getElementById("playButton");

  nextButton = document.getElementById("nextButton");

  seek = document.getElementById("seek");

  currentTime = document.getElementById("currentTime");

  endTime = document.getElementById("endTime");

  pad = function(d) {
    if (d < 10) {
      return "0" + d.toString();
    } else {
      return d.toString();
    }
  };

  getTimeFromSecs = function(secs) {
    var minString, minutes, secString, seconds;
    minutes = secs / 60;
    seconds = (minutes % 1) * 60;
    minString = Math.floor(minutes);
    secString = Math.floor(seconds);
    return "" + minString + ":" + (pad(secString));
  };

  logEvent = function(event) {
    var time;
    time = new Date().toTimeString().split(' ')[0];
    return console.log("" + time + " || " + event.target.id + " - " + event.type);
  };

  playNext = function() {
    var current, next;
    current = getActivePlayer();
    current.pause();
    preparePlayer(current);
    next = getReadyPlayer();
    setActivePlayer(next);
    return next.play();
  };

  setActivePlayer = function(player) {
    var isActive, p, players, _i, _len;
    players = document.getElementsByTagName("audio");
    for (_i = 0, _len = players.length; _i < _len; _i++) {
      p = players[_i];
      isActive = p.classList.contains("active");
      if (p === player && isActive !== true) {
        p.classList.add("active");
        p.classList.remove("ready");
      } else {
        p.classList.remove("active");
      }
    }
    song_title.innerHTML = player.getAttribute("title");
    endTime.innerHTML = getTimeFromSecs(player.getAttribute("duration") / 1000);
    $('#seek').attr("max", player.getAttribute("duration") / 1000);
    $('#container').css("background", "url(" + player.getAttribute("artwork") + ") no-repeat center center fixed");
    $('#container').css("background-size", "cover");
    player.addEventListener("timeupdate", function() {
      $('#seek').val(this.currentTime);
      return $('#currentTime').text(getTimeFromSecs(this.currentTime));
    });
    player.addEventListener("playing", function() {
      return playButton.innerHTML = "&#xf04c;";
    });
    player.addEventListener("pause", function() {
      return playButton.innerHTML = "&#xf04b;";
    });
    player.addEventListener("ended", function() {
      return playNext();
    });
    return player.play();
  };

  getActivePlayer = function() {
    return document.getElementsByClassName("active")[0];
  };

  getReadyPlayer = function() {
    var players, selected;
    players = document.getElementsByClassName("ready");
    return selected = players[Math.floor(Math.random() * players.length)];
  };

  preparePlayer = function(player) {
    var dfd;
    player.classList.remove("ready");
    player.removeEventListener("progress");
    player.removeEventListener("timeupdate");
    player.removeEventListener("playing");
    player.removeEventListener("pause");
    player.removeEventListener("ended");
    dfd = $.Deferred();
    getRandomSong().done(function(song) {
      player.src = song.stream_url;
      player.setAttribute("title", song.title);
      player.setAttribute("artwork", song.artwork);
      player.setAttribute("query", song.query);
      player.setAttribute("duration", song.duration);
      player.classList.add("ready");
      dfd.resolve(player);
    });
    return dfd.promise();
  };

  getRandomSong = function() {

    /*
    1. Get all tracks on SoundCloud for the query
    2. Break the tracks into two arrays - one with a K-POP indicator (genre, tags, or korean characters), one without any indicators
    3. Get top track for whichever array is used (use priority_songs if any in it)
    5. Get artwork, song title, and stream url to create player
     */
    var dfd, selected_song;
    selected_song = top_queries[Math.floor(Math.random() * top_queries.length)];
    dfd = $.Deferred();
    SC.get('/tracks', {
      q: selected_song,
      limit: 200
    }, function(tracks) {
      var add_criteria, approved_songs, artwork, blacklisted, duration, genre, priority_songs, ret_song, sURL, song, stream_url, tag, tag_list, tags, term, title, track, untagged_songs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n;
      if ((tracks != null) && tracks.length === 0) {
        ret_song = false;
        dfd.resolve(ret_song);
        return;
      }
      priority_songs = [];
      untagged_songs = [];
      approved_songs = [];

      /*
      BLACKLIST CHECK
      Check all songs to see if the title or tags contain a blaclisted word. All songs that pass the check are added to the approved_songs array.
       */
      for (_i = 0, _len = tracks.length; _i < _len; _i++) {
        song = tracks[_i];
        blacklisted = 0;
        if (song.genre == null) {
          genre = "";
        } else {
          genre = song.genre.toLowerCase();
        }
        if (song.title == null) {
          title = "";
        } else {
          title = song.title.toLowerCase();
        }
        if (song.stream_url == null) {
          sURL = "";
        } else {
          sURL = song.stream_url;
        }
        if (song.tag_list == null) {
          tags = [];
        } else {
          tag_list = song.tag_list.toLowerCase().split(" ");
        }
        for (_j = 0, _len1 = exclude_tags.length; _j < _len1; _j++) {
          term = exclude_tags[_j];
          if (title.indexOf(term) !== -1) {
            blacklisted += 1;
          }
        }
        for (_k = 0, _len2 = exclude_tags.length; _k < _len2; _k++) {
          term = exclude_tags[_k];
          for (_l = 0, _len3 = tag_list.length; _l < _len3; _l++) {
            tag = tag_list[_l];
            if (tag.indexOf(term) !== -1) {
              blacklisted += 1;
            }
          }
        }
        if (sURL === "") {
          blacklisted += 1;
        }
        if (blacklisted === 0) {
          approved_songs.push(song);
        }
      }

      /*
      PRIORITY CHECK
      Check all songs to see if they have indicators that they would be good quality or accurate. If so, put them into the priority array.
       */
      for (_m = 0, _len4 = approved_songs.length; _m < _len4; _m++) {
        song = approved_songs[_m];
        if (song.genre == null) {
          genre = "";
        } else {
          genre = song.genre.toLowerCase();
        }
        if (song.title == null) {
          title = "";
        } else {
          title = song.title.toLowerCase();
        }
        if (song.tag_list == null) {
          tags = [];
        } else {
          tag_list = song.tag_list.toLowerCase().split(" ");
        }
        add_criteria = 0;
        if (__indexOf.call(priority_tags, genre) >= 0) {
          add_criteria += 1;
        }
        if (tag_list.length > 0) {
          for (_n = 0, _len5 = tag_list.length; _n < _len5; _n++) {
            tag = tag_list[_n];
            if (__indexOf.call(priority_tags, tag) >= 0 && __indexOf.call(exclude_tags, tag) < 0) {
              add_criteria += 1;
            }
          }
        }
        if (hangul.test(title) === true) {
          add_criteria += 1;
        }
        if (add_criteria > 0) {
          priority_songs.push(song);
        } else {
          untagged_songs.push(song);
        }
      }

      /*
      SORT SONGS
      Sort priority array if there are songs in it, otherwise sort untagged array
       */
      if (priority_songs.length > 0) {
        priority_songs.sort(function(a, b) {
          var keyA, keyB;
          keyA = a.playback_count;
          keyB = b.playback_count;
          if (keyA > keyB) {
            return -1;
          }
          if (keyA < keyB) {
            return 1;
          }
          return 0;
        });
        track = priority_songs[0];
        artwork = track.artwork_url.replace("-large", "-t500x500");
        title = track.title;
        duration = track.duration;
        stream_url = track.stream_url;
      } else if (untagged_songs.length > 0) {
        untagged_songs.sort(function(a, b) {
          var keyA, keyB;
          keyA = a.playback_count;
          keyB = b.playback_count;
          if (keyA > keyB) {
            return -1;
          }
          if (keyA < keyB) {
            return 1;
          }
          return 0;
        });
        track = untagged_songs[0];
        artwork = track.artwork_url.replace("-large", "-t500x500");
        title = track.title;
        stream_url = track.stream_url;
        duration = track.duration;
      }
      if (stream_url != null) {
        ret_song = {
          artwork: artwork,
          title: title,
          duration: duration,
          stream_url: stream_url + "?client_id=" + client_id,
          query: selected_song
        };
      } else {
        ret_song = false;
      }
      dfd.resolve(ret_song);
    });
    return dfd.promise();
  };

  SC.initialize({
    client_id: client_id
  });

  _ref = [player_one, player_two, player_three, player_four, player_five];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    player = _ref[_i];
    player.addEventListener("error", (failed = function(e) {
      switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
          return console.log("You aborted the video playback.");
        case e.target.error.MEDIA_ERR_NETWORK:
          return console.log("A network error caused the audio download to fail.");
        case e.target.error.MEDIA_ERR_DECODE:
          return console.log("The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.");
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          return console.log("The video audio not be loaded, either because the server or network failed or because the format is not supported.");
        default:
          return console.log("An unknown error occurred.");
      }
    }), true);
  }


  /*
      player.addEventListener("load",logEvent)
      player.addEventListener("abort",logEvent)
      player.addEventListener("canplay",logEvent)
      player.addEventListener("canplaythrough",logEvent)
      player.addEventListener("durationchange",logEvent)
      player.addEventListener("emptied",logEvent)
      player.addEventListener("interruptbegin",logEvent)
      player.addEventListener("interruptend",logEvent)
      player.addEventListener("loadeddata",logEvent)
      player.addEventListener("loadedmetadata",logEvent)
      player.addEventListener("loadstart",logEvent)
      player.addEventListener("pause",logEvent)
      player.addEventListener("play",logEvent)
      player.addEventListener("playing",logEvent)
      player.addEventListener("ratechange",logEvent)
      player.addEventListener("seeked",logEvent)
      player.addEventListener("seeking",logEvent)
      player.addEventListener("stalled",logEvent)
       *player.addEventListener("progress",logEvent)
       *player.addEventListener("suspend",logEvent)
       *player.addEventListener("timeupdate",logEvent)
      player.addEventListener("volumechange",logEvent)
      player.addEventListener("waiting",logEvent)
      player.addEventListener("error",logEvent)
   */

  $('#seek').on("input", function() {
    var current;
    current = getActivePlayer();
    current.pause();
    return current.currentTime = $('#seek').val();
  });

  $('#seek').on("change", function() {
    var current;
    current = getActivePlayer();
    current.play();
    return current.currentTime = $('#seek').val();
  });

  $("#nextButton").click(function() {
    return playNext();
  });

  $("#playButton").click(function() {
    var active;
    active = getActivePlayer();
    if (active.paused) {
      return active.play();
    } else {
      return active.pause();
    }
  });

  $(document).ready(function() {
    return preparePlayer(player_one).done(function(player) {
      setActivePlayer(player);
      return preparePlayer(player_two).done(function() {
        return preparePlayer(player_three).done(function() {
          return preparePlayer(player_four).done(function() {
            return preparePlayer(player_five).done;
          });
        });
      });
    });
  });

}).call(this);
