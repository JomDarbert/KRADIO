(function() {
  var client_id, loadSounds, thing;

  client_id = "2721807f620a4047d473472d46865f14";

  SC.initialize({
    client_id: client_id
  });


  /*
  SC.get "/groups/55517/tracks", limit: 1, (tracks) ->
    console.log "Latest track: " + tracks[0].title
    return
   */

  loadSounds = function() {
    var deferred;
    deferred = $.Deferred();
    SC.get("/groups/55517/tracks", {
      limit: 1
    }, function(track) {
      return deferred.resolve(track);
    });
    return deferred.promise();
  };

  thing = [];

  loadSounds().done(function(song) {
    thing.push(song);
    return console.log(thing);
  });

}).call(this);
