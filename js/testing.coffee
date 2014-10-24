client_id       =   "2721807f620a4047d473472d46865f14"
SC.initialize client_id: client_id

today            = moment().format("YYYY-MM-DD HH:MM:SS")
query_start_date = moment().subtract(12, 'months').format("YYYY-MM-DD HH:MM:SS")

whitelist       = [ "kpop", "k pop", "k-pop", "korean", "korea"]
blacklist       = [ "cover", "acoustic", "instrumental", "remix", "mix", "re mix", 
                    "re-mix", "version", "ver.", "cvr"]

hangul_chars    =   "[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|"+
                    "\uD7B0-\uD7FF]"

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

for song in eyk
    top_queries.push song.title

for song in mwave
    top_queries.push song.artist + " " + song.title


(->
  processTracks = (tracks) ->
    trackArray = []
    tracks.forEach (track) ->

      if track.title?       then title    = track.title.toLowerCase()
      if track.genre?       then genre    = track.genre.toLowerCase()
      if track.tag_list?    then tags     = track.tag_list.toLowerCase().split(" ")
      if track.created_at?  then created  = moment(track.created_at)

      if genre in whitelist
        console.log title,genre


      trackArray.push song
      return

    #console.log trackArray
    return

  SC.initialize client_id: client_id

  for query in top_queries
    SC.get "/tracks", 
      q: query,
      limit: 200,
      processTracks
)()