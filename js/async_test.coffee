client_id       =   "2721807f620a4047d473472d46865f14"
SC.initialize client_id: client_id

###
SC.get "/groups/55517/tracks", limit: 1, (tracks) ->
  console.log "Latest track: " + tracks[0].title
  return
###

loadSounds = ->
  deferred = $.Deferred()
  SC.get "/groups/55517/tracks", limit: 1, (track) ->
    deferred.resolve track

  deferred.promise()

thing = []

loadSounds().done (song) ->
  thing.push song
  console.log thing

