client_id       =   "2721807f620a4047d473472d46865f14"
SC.initialize client_id: client_id

whitelist = [ 
  "kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", 
  "korean pop", "korean-pop", "kor-pop", "korean version", "kr",
  "kr ver", "original"
  ]

blacklist = [ 
  "cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", 
  "version", "ver.", "live", "live cover", "accapella", "cvr", "united states", 
  "america", "india", "indian", "japan", "china", "chinese", "japanese", "viet", 
  "vietnam", "vietnamese", "thai", "taiwan", "taiwanese", "russian", "ambient",
  "meditat"
  ]

hangul_chars    =   "[^A-Z|a-z|1-9|\u1100-\u11FF|^\u3130-\u318F|^\uA960-\uA97F|^\uAC00-\uD7AF|^\uD7B0-\uD7FF \[\]]"

english_chars   = "[]"
english         = new RegExp english_chars
hangul          = new RegExp hangul_chars

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
console.log hangul.exec("안녕 name 안녕[].")

console.log hangul.exec("tom test اختبار")

for song in eyk
    top_queries.push song.title

for song in mwave
    top_queries.push song.artist + " " + song.title


checkBlacklist = (song) ->
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


  # Song passed all checks
  return true


checkWhitelist = (song) ->
  points = 0
  if song.genre in whitelist then points += 1


processTracks = (tracks) ->
  songArray = []
  tracks.forEach (track) ->
    if track.title?       then title    = track.title.toLowerCase()
    if track.genre?       then genre    = track.genre.toLowerCase()
    if track.tag_list?    then tags     = track.tag_list.toLowerCase().split(" ")
    if track.created_at?  then created  = track.created_at
    if track.stream_url?  then url      = track.stream_url
    if track.artwork_url? then artwork  = track.artwork_url.replace("-large","-t500x500")

    songObj =
      title: title
      genre: genre
      tags: tags
      created: created
      url: url
      artwork: artwork

    blacklist_pass = checkBlacklist(songObj)
    #whitelist_score = checkWhitelist(songObj)


    ###

    for tag in tags when tag in whitelist
      points += 1
    ###



    return

  for song in songArray
    console.log song
  return


(->
  SC.initialize client_id: client_id

  for query in top_queries
    SC.get "/tracks", 
      q: query,
      limit: 200,
      processTracks
)()