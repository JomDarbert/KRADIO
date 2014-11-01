client_id       =   "2721807f620a4047d473472d46865f14"
SC.initialize client_id: client_id
queryLimit = 100
whitelist = ["kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "original"]
blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient", "meditat"]
not_kor_eng = /[^A-Za-z0-9\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF \♡\.\「\」\”\“\’\∞\♥\|\【\】\–\{\}\[\]\!\@\#\$\%\^\&\*\(\)\-\_\=\+\;\:\'\"\,\.\<\>\/\\\?\`\~]/g
has_korean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g

history = []
notAvailable = []
player_one = document.getElementById "player_one"
player_two = document.getElementById "player_two"
player_three = document.getElementById "player_three"
players = [player_one, player_two, player_three]

import_songs = (->
  json = null
  $.ajax
    async: false
    global: false
    url: "../scrape/songs.json"
    dataType: "json"
    success: (data) ->
      json = data
      return

  json
)()

top_queries = []
for song in import_songs
  top_queries.push song.query
top_queries = arrayUnique(top_queries)

# --------------------------------------------------------------
checkBlacklist = (song,query) ->
  # Don't want songs where critical values are missing
  if not song.title?    then return false
  if not song.url?      then return false
  if not song.created?  then return false

  # Don't want songs that were created more than one year ago
  ok_months    = 12
  created_date = moment(song.created, "YYYY-MM-DD HH:MM:SS")
  date_limit   = moment().subtract(ok_months, "months")

  if date_limit.diff(created_date, "months") > 0 then return false

  # Don't want songs with blacklist words in title
  for term in blacklist
    if song.title.indexOf(term) isnt -1 then return false

  # Don't want songs with blacklist words in genre
  for term in blacklist
    if song.genre? and song.genre.indexOf(term) isnt -1 then return false

  # Don't want songs with blacklist words in tags
  for term in blacklist
    if term in song.tags then return false

  # Don't want songs with characters that aren't English or Korean
  kor_eng_test = not_kor_eng.test(song.title)
  if kor_eng_test is true then return false

  # Don't want songs where none of the song's title words are in query
  cleaned_song = song.title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()
  cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()
  song_array = cleaned_song.split " "
  query_array = cleaned_query.split " "
  arrays = [song_array,query_array]
  result = arrays.shift().reduce((res, v) ->
    res.push v  if res.indexOf(v) is -1 and arrays.every((a) ->
      a.indexOf(v) isnt -1
    )
    res
  , [])
  if result.length is 0 then return false

  # Song passed all checks
  return true


checkWhitelist = (song,query) ->
  score = 0
  tags_count = 0
  query_count = 0
  cleaned_song = song.title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()
  cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()

  # Give a point if the song's genre is in whitelist
  if song.genre in whitelist then score += 1

  # Give a point if the song has a tag in whitelist
  for term in whitelist
    if term in song.tags then tags_count += 1

  if tags_count > 0 then score += 1

  # Give a point if the song title has korean in it
  test = has_korean.test(song.title)
  if test is true then score += 1

  # Give 2 score if all of the query's words are in song title
  song_array = cleaned_song.split " "
  query_array = cleaned_query.split " "
  arrays = [song_array,query_array]

  # Creates an array containing all words that are in both song and query arrays
  result = arrays.shift().reduce((res, v) ->
    res.push v  if res.indexOf(v) is -1 and arrays.every((a) ->
      a.indexOf(v) isnt -1
    )
    res
  , [])
  if result.length is query_array.length then score += 1

  # Give a point if levenstein distance is < 10
  if levenstein(cleaned_query,cleaned_song) <= 10 then score += 1

  return score



loadSong = (query) ->
  dfd = $.Deferred()
  SC.get '/tracks', {q: query, limit: queryLimit}, (tracks, err) ->
    # No tracks found for that query or Soundcloud had a problem (e.g. a 503 error)
    if not tracks? or tracks.length is 0 or err isnt null
      dfd.reject()
      return

    else
      acceptable = []

      # Create song object for each track and run tests to see if it is acceptable
      tracks.forEach (t) ->
        if t.title?           then title    = t.title.toLowerCase()
        if t.genre?           then genre    = t.genre.toLowerCase()
        if t.tag_list?        then tags     = t.tag_list.toLowerCase().split(" ")
        if t.created_at?      then created  = t.created_at
        if t.stream_url?      then url      = t.stream_url+"?client_id="+client_id
        if t.artwork_url?     then artwork  = t.artwork_url.replace("-large","-t500x500")
        if t.playback_count?  then views    = t.playback_count
        if t.duration?        then duration = t.duration/1000

        song = 
          title: title
          genre: genre
          tags: tags
          created: created
          url: url
          artwork: artwork
          duration: duration
          views: views
          score: 0
          query: query

        blacklist_pass = checkBlacklist(song,query)
        song.score = checkWhitelist(song,query)

        if blacklist_pass is true and song.score >= 2 then acceptable.push song

      # Sort acceptable by score and then number of views
      acceptable.sort (x, y) ->
        n = y.score - x.score
        return n unless n is 0
        y.views - x.views

      # If there are any acceptable songs, return the best one, otherwise fail
      if acceptable.length > 0 then dfd.resolve(acceptable[0])
      else dfd.reject()
    return
  return dfd.promise()


addToHistory = (song) ->
  len = history.length
  max = 9 # 10 songs
  if song.query? then history.unshift song.query
  if len > max then history.splice max+1, len-max
  return


# Gets a random query that isn't in the recently played list or not available list
randomQuery = () ->
  availableSongs = top_queries.filter((x) -> history.indexOf(x) < 0)
  availableSongs = availableSongs.filter((y) -> notAvailable.indexOf(y) < 0)
  return availableSongs[Math.floor(Math.random()*availableSongs.length)]


# Tries to load a song, and if loading fails, tries to load a new song until success
processSong = (query) ->
  request = (query) ->
    loadSong(query).done((song) ->
      addToHistory(song)
      dfd.resolve(song)
    ).fail( ->
      notAvailable.push query
      newQ = randomQuery()
      request(newQ)
    )

  dfd = $.Deferred()
  request(query)
  return dfd.promise()



choosePlayer = ->
  players = [player_one,player_two,player_three]
  c = players.indexOf(document.getElementsByClassName("active")[0])
  len = players.length - 1

  if not c? or c is len then a = 0
  else a = c + 1
  if a is len then n = 0
  else n = a + 1
  if n is len then o = 0
  else o = n + 1

  seq = active: players[a], next: players[n], onDeck: players[o], last: players[c]

  seq.active.classList.add "active"
  seq.next.classList.remove "active"
  seq.onDeck.classList.remove "active"
  return seq

Number.prototype.toHHMMSS = ->
  h = Math.floor(@ / 3600)
  m = Math.floor(@ % 3600 / 60)
  s = Math.floor(@ % 3600 % 60)
  ((if h > 0 then h + ":" else "")) + ((if m > 0 then ((if h > 0 and m < 10 then "0" else "")) + m + ":" else "0:")) + ((if s < 10 then "0" else "")) + s

nextSong = ->
  players = choosePlayer()
  query = randomQuery()
  endTime = players.active.duration.toHHMMSS()
  art = players.active.getAttribute "artwork"
  title = players.active.getAttribute "songtitle"
  max = players.active.getAttribute "songlength"

  players.last.pause()
  players.active.play()
  $('#endTime').val endTime
  $('#seek').attr "max", max
  $('#title').text title
  $('#container').css "background", "url(#{art}) no-repeat center center fixed"
  $('#container').css "background-size", "cover"

  processSong(query).done (result) ->
    players.last.setAttribute "src", result.url
    players.last.setAttribute "artwork", result.artwork
    players.last.setAttribute "songtitle", result.title
    players.last.setAttribute "songlength", result.duration

# ----------------------------------------------------------
$('#nextButton').on "click", -> nextSong()

$('#playButton').on "click", ->
  p = document.getElementsByClassName("active")[0]
  if p.paused
    $('#playButton').html "&#xf04c;"
    p.play()
  else 
    $('#playButton').html "&#xf04b;"
    p.pause()

for player in players
    $(player).on "playing", -> $('#playButton').html "&#xf04c;"
    $(player).on "ended", -> nextSong()
    $(player).on "timeupdate", ->
        $('#currentTime').val @currentTime.toHHMMSS()
        $('#seek').val @currentTime

$('#seek').on "input", ->
  c = document.getElementsByClassName("active")[0]
  c.pause()
  c.currentTime = @value

$('#seek').on "change", ->
  c = document.getElementsByClassName("active")[0]
  c.play()

# On document ready, load the first song for all three players.
$(document).ready ->
  q_one = randomQuery()
  q_two = randomQuery()
  q_three = randomQuery()

  processSong(q_one).done (res_one) ->
    player_one.setAttribute "src", res_one.url
    player_one.setAttribute "artwork", res_one.artwork
    player_one.setAttribute "songtitle", res_one.title
    player_one.setAttribute "songlength", res_one.duration
    $('#endTime').val res_one.duration.toHHMMSS()
    $('#seek').attr "max", res_one.duration
    $('#container').css "background", "url(#{res_one.artwork}) no-repeat center center fixed"
    $('#container').css "background-size", "cover"
    $('#title').text res_one.title

  processSong(q_two).done (res_two) ->
    player_two.setAttribute "src", res_two.url
    player_two.setAttribute "artwork", res_two.artwork
    player_two.setAttribute "songtitle", res_two.title
    player_two.setAttribute "songlength", res_two.duration

  processSong(q_three).done (res_three) ->
    player_three.setAttribute "src", res_three.url
    player_three.setAttribute "artwork", res_three.artwork
    player_three.setAttribute "songtitle", res_three.title
    player_three.setAttribute "songlength", res_three.duration