
/*
Auto-scraping
http://stackoverflow.com/questions/4138251/preload-html5-audio-while-it-is-playing
http://stackoverflow.com/questions/7779697/javascript-asynchronous-return-value-assignment-with-jquery
 */
var activePlayer, client_id, currentTime, endTime, exclude_tags, findInactive, getRandomSong, getTimeFromSecs, hangul, inactivePlayer, logEvent, nextButton, pad, playButton, player_one, player_two, priority_tags, seek, switchPlayer, title, top_queries,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

client_id = "2721807f620a4047d473472d46865f14";

priority_tags = ["kpop", "k pop", "k-pop", "korean", "korea"];

exclude_tags = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "cvr"];

hangul = new RegExp("[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|\uD7B0-\uD7FF]");

top_queries = ["Madtown YOLO", "VIXX Error", "BTOB You're so fly", "PSY Hangover", "Boyfriend Witch", "Raina You End And Me", "Song Ji Eun Don't look at me like that", "Ailee Don't touch me", "Holler Taetiseo", "The Space Between Soyu", "Go Crazy 2PM", "Teen Top Missing", "I Swear Sistar", "Empty B.I", "Anticipation Note NS YOON-G", "Beautiful PARK BO RAM", "Because I love You VIBE", "양화대교 Yanghwa Bridge Zion. T", "Sugar Free T-ara", "소격동 Sogyeokdong IU", "Let’s Not Go Crazy 8Eight", "How I Am Kim Dong Ryul", "Darling Girl’s Day", "연애하나 봐 I Think I’m In Love Juniel", "쳐다보지마 Don’t Look At Me Like That Song Ji Eun Secret", "HER Block B", "울컥 All Of A Sudden Krystal", "눈물나는 내 사랑 Teardrop Of My Heart Kim Bum Soo", "A Real Man Swings, Ailee", "너무 보고 싶어 I Miss You So Much Acoustic Collabo", "I Love You Yoon Mi Rae", "MAMACITA Super Junior", "I’ll Remain As A Friend Wheesung, Geeks", "맘마미아 Mamma Mia Kara", "The Day Noel", "You’re So Fly BTOB", "괜찮아 사랑이야 It’s Okay, That’s Love Davichi", "Give Your Love? SPICA.S", "I’m Fine Thank You Ladies’ Code", "Still I’m By Your Side Clazziquai", "Love Fiction Ulala Session", "Body Language feat. Bumkey San E", "눈, 코, 입 Eyes, Nose, Lips Taeyang", "잠 못드는 밤 Sleepless Night feat. Punch Crush", "노크 KNOCK Nasty Nasty", "최고의 행운 Best Luck Chen EXO-M", "컬러링 Color Ring WINNER", "Love Me feat. Kim Tae Chun Linus’ Blanket", "두 번 죽이는 말 Words To Kill Monday Kiz", "Cha-Ga-Wa F.Cuz", "빨개요 Red HyunA", "그 한 사람 That One Person Lee Seung Hwan", "Difficult Woman Jang Bum Joon", "자전거 Bicycle Gary, Jung In", "Pitiful feat. Hip Job Gavy NJ", "Everyone Else But Me Yoo Seung Woo", "가을냄새 I Smell The Autumn  Verbal Jint"];

player_one = document.getElementById("player_one");

player_two = document.getElementById("player_two");

title = document.getElementById("title");

playButton = document.getElementById("playButton");

nextButton = document.getElementById("nextButton");

seek = document.getElementById("seek");

currentTime = document.getElementById("currentTime");

endTime = document.getElementById("endTime");

activePlayer = player_one;

inactivePlayer = player_two;

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

switchPlayer = function() {
  var oldActive, oldInactive;
  oldActive = activePlayer;
  oldInactive = inactivePlayer;
  activePlayer = oldInactive;
  return inactivePlayer = oldActive;
};

findInactive = function() {
  if (activePlayer === player_one) {
    return inactivePlayer = player_two;
  } else {
    return inactivePlayer = player_one;
  }
};

logEvent = function(event) {
  var time;
  time = new Date().toTimeString().split(' ')[0];
  return console.log("" + time + " - " + event.type);
};

getRandomSong = function() {
  var dfd, selected_song;
  console.log("" + (new Date()) + " Started getRandomSong()");

  /*
  1. Get all tracks on SoundCloud for the query
  2. Break the tracks into two arrays - one with a K-POP indicator (genre, tags, or korean characters), one without any indicators
  3. Get top track for whichever array is used (use priority_songs if any in it)
  5. Get artwork, song title, and stream url to create player
   */
  selected_song = top_queries[Math.floor(Math.random() * top_queries.length)];
  dfd = $.Deferred();
  SC.get('/tracks', {
    q: selected_song,
    limit: 200
  }, function(tracks) {
    var add_criteria, approved_songs, artwork, blacklisted, duration, genre, priority_songs, ret_song, sURL, song, stream_url, tag, tag_list, tags, term, track, untagged_songs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n;
    console.log("" + (new Date()) + " entered SC.get");
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
    console.log("" + (new Date()) + " finished blacklist checking");

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
    console.log("" + (new Date()) + " finished whitelist checking");

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
    console.log("" + (new Date()) + " finished sorting");
    if (stream_url != null) {
      ret_song = {
        artwork: artwork,
        title: title,
        duration: duration,
        stream_url: stream_url,
        query: selected_song
      };
    } else {
      ret_song = false;
    }
    dfd.resolve(ret_song);
    console.log("" + (new Date()) + " finished resolving");
  });
  return dfd.promise();
};


/*

player.addEventListener "error", (failed = (e) ->
  switch e.target.error.code
    when e.target.error.MEDIA_ERR_ABORTED
      console.log "You aborted the video playback."
    when e.target.error.MEDIA_ERR_NETWORK
      console.log "A network error caused the audio download to fail."
    when e.target.error.MEDIA_ERR_DECODE
      console.log "The audio playback was aborted due to a corruption problem or because the video used features your browser did not support."
    when e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED
      console.log "The video audio not be loaded, either because the server or network failed or because the format is not supported."
    else
      console.log "An unknown error occurred."
), true

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


/*
activePlayer.addEventListener "canplay", ->
    $("#nextButton").removeClass('spin')

activePlayer.addEventListener "playing", ->
    playButton.innerHTML = "&#xf04c;"

activePlayer.addEventListener "pause", ->
    playButton.innerHTML = "&#xf04b;"


activePlayer.addEventListener "timeupdate", ->
    $('#seek').val(activePlayer.currentTime)
    $('#currentTime').text(getTimeFromSecs(activePlayer.currentTime))

activePlayer.addEventListener "progress", ->
    if activePlayer.buffered.length > 0
        buffered = (activePlayer.buffered.end(0)/activePlayer.duration)*100+"%"
        remaining = (100 - ((activePlayer.buffered.end(0)/activePlayer.duration)*100))+"%"
        $('#seek').css "background-image", "linear-gradient(to right,#278998 #{buffered},transparent #{remaining})"

activePlayer.addEventListener "ended", ->
    getRandomSong()

activePlayer.addEventListener "stalled waiting", ->
    $("#nextButton").addClass('spin')
 */

$('#seek').on("input", function() {
  activePlayer.pause();
  return activePlayer.currentTime = $('#seek').val();
});

$('#seek').on("change", function() {
  activePlayer.play();
  return activePlayer.currentTime = $('#seek').val();
});

$("#nextButton").click(function() {
  console.log("---------- NEXT PRESSED ----------");
  return getRandomSong().done(function(obj) {
    console.log(obj);
    return console.log("" + (new Date()) + " finished getRandomSong()");
  });
});

$("#playButton").click(function() {
  if (activePlayer.paused) {
    return activePlayer.play();
  } else {
    return activePlayer.pause();
  }
});

$(document).ready(function() {
  return SC.initialize({
    client_id: client_id
  });
});
