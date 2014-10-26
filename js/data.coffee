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

queries = []
for song in eyk
    queries.push song.title

for song in mwave
    queries.push song.artist + " " + song.title

queries = arrayUnique(queries)