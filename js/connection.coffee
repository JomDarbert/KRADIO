client_id       =   "2721807f620a4047d473472d46865f14"
###
lastfm = new LastFM(
  apiKey: "c04e77b276f955f8ed3a94006abb8c42"
  apiSecret: "69b6345d1e154c9b60f0b32b85268dad"
)
###
SC.initialize client_id: client_id
queryLimit = 100
whitelist = ["kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "original"]
blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient", "meditat", "short", "club"]
not_kor_eng = /[^A-Za-z0-9\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF \♡\.\「\」\”\“\’\∞\♥\|\【\】\–\{\}\[\]\!\@\#\$\%\^\&\*\(\)\-\_\=\+\;\:\'\"\,\.\<\>\/\\\?\`\~]/g
has_korean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g
only_korean = /[^\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g
history = []
notAvailable = []

getCookie = (name) ->
  re = new RegExp(name + "=([^;]+)")
  value = re.exec(document.cookie)
  (if (value?) then unescape(value[1]) else null)

cookie_dontPlay = getCookie("dontPlay")
if cookie_dontPlay isnt null then dontPlay = JSON.parse cookie_dontPlay
else dontPlay = []

player_one = document.getElementById "player_one"
player_two = document.getElementById "player_two"
player_three = document.getElementById "player_three"
player_four = document.getElementById "player_four"
player_five = document.getElementById "player_five"
players = [player_one, player_two, player_three, player_four, player_five]

getSongJSON = ->
  xmlHttp = null
  xmlHttp = new XMLHttpRequest()
  xmlHttp.open "GET", "http://jombly.com:3000/today", false
  xmlHttp.send null
  xmlHttp.responseText

vote = (query, tag) ->
  $.post "http://localhost:3000/vote",
    query: query
    tag: tag
  , (data) ->
    console.log data[1]
    return

song_data = JSON.parse getSongJSON()
top_queries = arrayUnique(song_data)
top_queries = top_queries.filter((z) -> dontPlay.indexOf(z.query) < 0)
# --------------------------------------------------------------
Number.prototype.toHHMMSS = ->
  h = Math.floor(@ / 3600)
  m = Math.floor(@ % 3600 / 60)
  s = Math.floor(@ % 3600 % 60)
  ((if h > 0 then h + ":" else "")) + ((if m > 0 then ((if h > 0 and m < 10 then "0" else "")) + m + ":" else "0:")) + ((if s < 10 then "0" else "")) + s

UrlExists = (url, cb) ->
  jQuery.ajax
    url: url
    dataType: "text"
    type: "GET"
    complete: (xhr) ->
      cb.apply this, [xhr.status]  if typeof cb is "function"
      return
  return

checkBlacklist = (song,query) ->
  # Don't want songs where critical values are missing
  if not song.orig_title? then return false
  if not song.url?        then return false
  if not song.created?    then return false

  # Don't want songs that were created more than one year ago
  ok_months    = 12
  created_date = moment(song.created, "YYYY-MM-DD HH:MM:SS")
  date_limit   = moment().subtract(ok_months, "months")

  if date_limit.diff(created_date, "months") > 0 then return false

  # Don't want songs that are longer than 6 minutes
  if song.duration > 360 then return false

  # Don't want songs with blacklist words in title
  for term in blacklist
    if song.orig_title.indexOf(term) isnt -1 then return false

  # Don't want songs with blacklist words in genre
  for term in blacklist
    if song.genre? and song.genre.indexOf(term) isnt -1 then return false

  # Don't want songs with blacklist words in tags
  for term in blacklist
    if term in song.tags then return false

  # Don't want songs with characters that aren't English or Korean
  kor_eng_test = not_kor_eng.test(song.orig_title)
  if kor_eng_test is true then return false

  # Don't want songs where none of the song's title words are in query
  cleaned_song = song.orig_title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()
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

  # Don't want songs with a levenstein distance > 8
  if levenstein(cleaned_query,cleaned_song) >= 8 then return false

  # Song passed all checks
  return true


checkWhitelist = (song,query) ->
  score = 0
  tags_count = 0
  query_count = 0
  cleaned_song = song.orig_title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()
  cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim()

  # Give a point if the song's genre is in whitelist
  if song.genre in whitelist then score += 1

  # Give a point if the song has a tag in whitelist
  for term in whitelist
    if term in song.tags then tags_count += 1

  if tags_count > 0 then score += 1

  # Give a point if the song title has korean in it
  test = has_korean.test(song.orig_title)
  if test is true then score += 1

  # Give a point if all of the query's words are in song title
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
  if levenstein(cleaned_query,cleaned_song) <= 5 then score += 1

  return score



loadSong = (q) ->
  ###
  get purchase links from lastfm
  lastfm.track.getBuylinks({artist: q.artist, track: q.title, country: 'US'}
  , success: (data) ->
    buyLinks = data.affiliations.downloads.affiliation
  , error: (code, message) ->
    console.log code,message
  )
  ###

  dfd = $.Deferred()
  SC.get '/tracks', {q: q.query, limit: queryLimit}, (tracks, err) ->
    # No tracks found for that query or Soundcloud had a problem (e.g. a 503 error)
    if not tracks? or tracks.length is 0 or err isnt null
      dfd.reject()
      return

    else
      acceptable = []

      # Create song object for each track and run tests to see if it is acceptable
      tracks.forEach (t) ->
        test = has_korean.test(t.title)
        if t.title? and test is true
          korean = "(#{t.title.toLowerCase().replace(only_korean,"")})"
        else korean = ""
        if t.genre?           then genre    = t.genre.toLowerCase()
        if t.tag_list?        then tags     = t.tag_list.toLowerCase().split(" ")
        if t.created_at?      then created  = t.created_at
        if t.stream_url?      then url      = t.stream_url+"?client_id="+client_id
        if t.artwork_url?     then artwork  = t.artwork_url.replace("-large","-t500x500")
        if t.playback_count?  then views    = t.playback_count
        if t.duration?        then duration = t.duration/1000

        song = 
          title: "#{q.artist}  —  #{q.title} #{korean}"
          orig_title: t.title
          song: q.title
          artist: q.artist
          rank: q.rank
          num_days: q.num_days
          change: q.change
          korean: korean
          genre: genre
          tags: tags
          created: created
          url: url
          artwork: artwork
          duration: duration
          views: views
          score: 0
          query: q.query

        blacklist_pass = checkBlacklist(song,q.query)
        song.score = checkWhitelist(song,q.query)

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
  max = 19 # 20 songs
  if song.query? then history.unshift song.query
  if len > max then history.splice max+1, len-max
  return

# Gets a random query that isn't in the recently played list or not available list
randomQuery = () ->
  availableSongs = top_queries.filter((x) -> history.indexOf(x.query) < 0)
  availableSongs = availableSongs.filter((y) -> notAvailable.indexOf(y.query) < 0)
  availableSongs = availableSongs.filter((z) -> dontPlay.indexOf(z.query) < 0)
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
  players = [player_one,player_two,player_three,player_four,player_five]
  c = players.indexOf(document.getElementsByClassName("active")[0])
  len = players.length - 1


  if not c? or c is len then a = 0
  else a = c + 1
  if a is len then n = 0
  else n = a + 1
  if n is len then o = 0
  else o = n + 1
  if o is len then otwo = 0
  else otwo = o + 1
  if otwo is len then othr = 0
  else othr = otwo + 1

  seq = active: players[a], next: players[n], onDeck: players[o], onDeckTwo: players[otwo], onDeckThree: players[othr], last: players[c]

  seq.active.classList.add "active"
  seq.next.classList.remove "active"
  seq.onDeck.classList.remove "active"
  seq.onDeckTwo.classList.remove "active"
  seq.onDeckThree.classList.remove "active"
  return seq


setPlayerAttributes = (player,song) ->
  source = player.getElementsByTagName("SOURCE")[0]
  source.setAttribute "src", song.url
  player.setAttribute "artwork", song.artwork
  player.setAttribute "songtitle", song.title
  player.setAttribute "songlength", song.duration
  player.setAttribute "rank", song.rank
  player.setAttribute "change", song.change
  player.setAttribute "num_days", song.num_days
  player.setAttribute "query", song.query
  player.load()

nextSong = ->
  players = choosePlayer()
  source = players.active.getElementsByTagName("SOURCE")[0]
  query = randomQuery()
  endTime = Number(players.active.getAttribute("songlength")).toHHMMSS()
  art = players.active.getAttribute "artwork"
  title = players.active.getAttribute "songtitle"
  max = players.active.getAttribute "songlength"
  url = source.getAttribute "src"
  rank = players.active.getAttribute "rank"
  change = players.active.getAttribute "change"
  num_days = players.active.getAttribute "num_days"

  UrlExists url, (status) ->
    if status is 404 or status is 503
      nextSong()
      return

  UrlExists art, (status) ->
    if status is 404 or status is 503
      nextSong()
      return

  players.last.pause()
  players.active.play()

  if endTime? and endTime isnt undefined then $('#endTime').val endTime
  if max? and max isnt undefined then $('#seek').attr "max", max
  if title? and title isnt undefined then $('#title').text title
  if art? and art isnt undefined
      $('#container').css "background", "url(#{art}) no-repeat center center"

  $('#title').text title
  document.title = title
  $('#rank').text "Rank #{rank}"
  if change < 0 
    $('#change').css "color", "#D7431B"
    $('#change').text "( #{change} )"
  if change > 0 
    $('#change').css "color", "#288668"
    $('#change').text "( +#{change} )"
  if change is 0 
    $('#change').css "color", "#2d3033"
    $('#change').text "( — )"

  $('#daysOnChart').text "#{num_days} days on chart"

  $('#recentSongs').prepend "<li>#{players.last.getAttribute "songtitle"}</li><button class='removeThumb'>&#xf00d;</button>"

  processSong(query).done (result) ->
    setPlayerAttributes(players.last,result)

  return


# ----------------------------------------------------------
document.addEventListener "touchmove", (event) -> 
  if event.target.tagName isnt "INPUT" then event.preventDefault()

xStart = undefined
yStart = 0
document.addEventListener "touchstart", (e) ->
  xStart = e.touches[0].screenX
  yStart = e.touches[0].screenY
  return

document.addEventListener "touchmove", (e) ->
  xMovement = Math.abs(e.touches[0].screenX - xStart)
  yMovement = Math.abs(e.touches[0].screenY - yStart)
  e.preventDefault()  if (yMovement * 3) > xMovement
  return

$('#test').on "click", ->
  p = document.getElementsByClassName("active")[0]
  query = p.getAttribute "query"
  vote("epik high happen ending","test tag")

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
  player.volume = 0.5
  player.oncanplay = ->
    p = @
    reloadAt = (@duration+30)*1000
    setTimeout (->
      if p.paused
        query = randomQuery()
        processSong(query).done (result) ->
          setPlayerAttributes(p,result)
      return
    ), reloadAt


  player.onerror = -> nextSong()

  player.onplaying = -> 
    $('#playButton').html "&#xf04c;"

  player.onended = -> nextSong()
  player.ontimeupdate = ->
    $('#currentTime').val @currentTime.toHHMMSS()
    $('#seek').val @currentTime

$('#seek').on "input", ->
  c = document.getElementsByClassName("active")[0]
  c.pause()
  c.currentTime = @value

$('#seek').on "change", ->
  c = document.getElementsByClassName("active")[0]
  c.play()

$('#volume').on "input change", ->
  player_one.volume = @value
  player_two.volume = @value
  player_three.volume = @value
  player_four.volume = @value
  player_five.volume = @value


$('#dontPlay').on "click", ->
  c = document.getElementsByClassName("active")[0]
  query = c.getAttribute "query"
  title = c.getAttribute "songtitle"
  dontPlay.push query
  document.cookie = "dontPlay="+JSON.stringify dontPlay
  $('#thumbsDownSongs').prepend "<li>#{title}</li>"
  nextSong()

$('#showOverlay').on "click", ->
  $('#overlay').toggleClass "hidden"
  $('#container').toggleClass "hidden"

for song in dontPlay
  $('#thumbsDownSongs').prepend "<li>#{song}</li>"

for song in top_queries
  comb = "#{song.artist} - #{song.title}"
  $('#topList').append "<li>#{comb}</li>"

# On document ready, load the first song for all three players.
$(document).ready ->
  q_one = randomQuery()
  q_two = randomQuery()
  q_three = randomQuery()
  q_four = randomQuery()
  q_five = randomQuery()

  processSong(q_one).done (res_one) ->
    setPlayerAttributes(player_one,res_one)

    UrlExists res_one.url, (status) ->
      if status is 404 or status is 503
        nextSong()
        return

    UrlExists res_one.artwork, (status) ->
      if status is 404 or status is 503
        nextSong()
        return

    if res_one.duration?
      $('#endTime').val res_one.duration.toHHMMSS()
      $('#seek').attr "max", res_one.duration

    if res_one.artwork?
      $('#container').css "background", "url(#{res_one.artwork}) no-repeat center center"

    $('#title').text res_one.title
    $('#rank').text "Rank #{res_one.rank}"
    if res_one.change < 0 
      $('#change').css "color", "#D7431B"
      $('#change').text "( #{res_one.change} )"
    if res_one.change > 0 
      $('#change').css "color", "#288668"
      $('#change').text "( +#{res_one.change} )"
    if res_one.change is 0 
      $('#change').css "color", "#2d3033"
      $('#change').text "( — )"

    $('#daysOnChart').text "#{res_one.num_days} days on chart"

  processSong(q_two).done (res_two) ->
    setPlayerAttributes(player_two,res_two)

  processSong(q_three).done (res_three) ->
    setPlayerAttributes(player_three,res_three)

  processSong(q_four).done (res_four) ->
    setPlayerAttributes(player_four,res_four)

  processSong(q_five).done (res_five) ->
    setPlayerAttributes(player_five,res_five)