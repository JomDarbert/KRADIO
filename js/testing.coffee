client_id       =   "2721807f620a4047d473472d46865f14"
SC.initialize client_id: client_id
queryLimit = 100
whitelist = ["kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "original"]
blacklist = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient", "meditat"]
not_kor_eng = /[^A-Za-z0-9\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF \♡\.\「\」\”\“\’\∞\♥\|\【\】\–\{\}\[\]\!\@\#\$\%\^\&\*\(\)\-\_\=\+\;\:\'\"\,\.\<\>\/\\\?\`\~]/g
has_korean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g

history = []
notAvailable = []
upcoming = null
error = false

eyk = (->
  json = null
  $.ajax
    async: false
    global: false
    url: "../scrape/EYK/tutorial/eyk.json"
    dataType: "json"
    success: (data) ->
      json = data
      return

  json
)()

mwave = (->
  json = null
  $.ajax
    async: false
    global: false
    url: "../scrape/MWAVE/tutorial/mwave.json"
    dataType: "json"
    success: (data) ->
      json = data
      return

  json
)()

top_queries = []

for song in eyk
  song = song.title
  song = song.toLowerCase()
  top_queries.push song

for song in mwave
  song = song.artist+" "+song.title
  song = song.toLowerCase()
  top_queries.push song

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
  console.log "waiting for get..."
  SC.get '/tracks', {q: query, limit: queryLimit}, (tracks) ->
    if not tracks? or tracks.length is 0
      dfd.resolve(false)
      return

    else
      finalists = []
      tracks.forEach (track) ->
        if track.title?           then title    = track.title.toLowerCase()
        if track.genre?           then genre    = track.genre.toLowerCase()
        if track.tag_list?        then tags     = track.tag_list.toLowerCase().split(" ")
        if track.created_at?      then created  = track.created_at
        if track.stream_url?      then url      = track.stream_url+"?client_id="+client_id
        if track.artwork_url?     then artwork  = track.artwork_url.replace("-large","-t500x500")
        if track.playback_count?  then views    = track.playback_count
        if track.duration?        then duration = track.duration/1000

        # Check song against blacklist and whitelist. Songs that have a positive whitelist score get pushed into finalists array.
        song = 
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

        blacklist_pass = checkBlacklist(song,query)
        song.score = checkWhitelist(song,query)

        if blacklist_pass is true and song.score >= 2
          finalists.push song

      # Sort finalists by score and then number of views
      finalists.sort (x, y) ->
        n = y.score - x.score
        return n unless n is 0
        y.views - x.views

      if finalists.length > 0 then dfd.resolve(finalists[0])
      else dfd.resolve(false)
    return
  return dfd.promise()

addToHistory = (song) ->
  len = history.length
  max = 9 # 10 songs

  if song.query? then history.unshift song.query
  if len > max then history.splice max+1, len-max
  console.log "done adding to history"
  return

# Gets a random query that isn't in the recently played list
randomQuery = () ->
  availableSongs = top_queries.filter((x) ->
    history.indexOf(x) < 0
  )
  availableSongs = availableSongs.filter((y) ->
    notAvailable.indexOf(y) < 0
  )
  console.log "done random query"
  return availableSongs[Math.floor(Math.random()*availableSongs.length)]


processSong = (query) ->
  dfd = $.Deferred()

  loadSong(query).done (song) ->
    console.log "loaded: "+song.title
    if song isnt false
      addToHistory(song)
      upcoming = randomQuery()
      console.log upcoming
      dfd.resolve(song)
    else
      console.log "error: #{query}"
      notAvailable.push query
      error = true
      upcoming = randomQuery()
      dfd.resolve(false)
    return
  return dfd.promise()


$('#test').on "click", ->
  if upcoming? then query = upcoming
  else query = randomQuery()
  console.log notAvailable

  # not pass fail, song or false FIX
  processSong(query).done (result_one) ->
    console.log "result 1: #{result_one}"
    $('#player_one').attr "src", result_one.url
    player = document.getElementById "player_one"
    player.play()

    if result_one is false
      query = randomQuery()
      processSong(query).done (result_two) ->
        console.log "result 2: #{result_two}"

        if result_two is false
          query = randomQuery()
          processSong(query).done (result_three) ->
            console.log "result 3: #{result_three}"