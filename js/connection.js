(function() {
  var client_id, currently_playing, exclude_tags, hangul, playRandom, priority_tags, top_queries,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  client_id = "2721807f620a4047d473472d46865f14";

  SC.initialize({
    client_id: client_id
  });

  priority_tags = ["kpop", "k pop", "k-pop", "korean", "korea"];

  exclude_tags = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "cvr"];

  hangul = new RegExp("[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|\uD7B0-\uD7FF]");

  top_queries = ["Block B Very Good"];

  currently_playing = null;

  playRandom = function() {
    var selected_song;
    while (true) {
      selected_song = top_queries[Math.floor(Math.random() * top_queries.length)];
      if (selected_song !== currently_playing) {
        break;
      }
    }
    currently_playing = selected_song;

    /*
    1. Get all tracks on SoundCloud for the query
    2. Break the tracks into two arrays - one with a K-POP indicator (genre, tags, or korean characters), one without any indicators
    3. Get top track for whichever array is used (use priority_songs if any in it)
    5. Get artwork, song title, and stream url to create player
     */
    SC.get('/tracks', {
      q: selected_song
    }, function(tracks) {
      var add_criteria, approved_songs, artwork, blacklisted, genre, priority_songs, song, stream_url, tag, tag_list, tags, term, title, track, untagged_songs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n;
      if (tracks.length === 0) {
        playRandom();
      } else {
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
          stream_url = track.stream_url;
          genre = track.genre;
          tags = track.tag_list;
        } else {
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
        }
        $("#player").attr("src", stream_url + "?client_id=" + client_id);
        $("#title").text(title);
        $("#artwork").attr("src", artwork);
      }
    });
  };

  $("#next").click(function() {
    return playRandom();
  });

}).call(this);
