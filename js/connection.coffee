###
Auto-scraping
http://stackoverflow.com/questions/4138251/preload-html5-audio-while-it-is-playing
http://stackoverflow.com/questions/7779697/javascript-asynchronous-return-value-assignment-with-jquery

to do - is it currently playing
###

client_id       =   "2721807f620a4047d473472d46865f14"
priority_tags   = [ "kpop", "k pop", "k-pop", "korean", "korea"]
exclude_tags    = [ "cover", "acoustic", "instrumental", "remix", "mix", "re mix", 
                    "re-mix", "version", "ver.", "cvr"]

hangul_chars    =   "[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|"+
                    "\uD7B0-\uD7FF]"

hangul          = new RegExp hangul_chars

top_queries     = [ "Madtown YOLO"
                    "VIXX Error"
                    "BTOB You're so fly"
                    "PSY Hangover"
                    "Boyfriend Witch"
                    "Raina You End And Me"
                    "Song Ji Eun Don't look at me like that"
                    "Ailee Don't touch me"
                  ]


player_one          = document.getElementById("player_one")
player_two          = document.getElementById("player_two")
player_three        = document.getElementById("player_three")
player_four         = document.getElementById("player_four")
player_five         = document.getElementById("player_five")
song_title          = document.getElementById("title")
container           = document.getElementById("container")
playButton          = document.getElementById("playButton")
nextButton          = document.getElementById("nextButton")
seek                = document.getElementById("seek")
currentTime         = document.getElementById("currentTime")
endTime             = document.getElementById("endTime")

pad = (d) -> (if (d < 10) then "0" + d.toString() else d.toString())

getTimeFromSecs = (secs) ->
    minutes = secs/60
    seconds = (minutes % 1)*60
    minString = Math.floor(minutes)
    secString = Math.floor(seconds)
    return "#{minString}:#{pad(secString)}"

logEvent = (event) ->
    time = new Date().toTimeString().split(' ')[0]
    console.log "#{time} || #{event.target.id} - #{event.type}"

playNext = ->
    current = getActivePlayer()
    current.pause()
    preparePlayer(current)

    next = getReadyPlayer()
    setActivePlayer(next)
    next.play()

setActivePlayer = (player) ->
    players = document.getElementsByTagName "audio"
    for p in players
        isActive = p.classList.contains "active"
        if p is player and isActive isnt true
            p.classList.add "active"
            p.classList.remove "ready"
        else p.classList.remove "active"

    song_title.innerHTML = player.getAttribute "title"
    endTime.innerHTML = getTimeFromSecs(player.getAttribute("duration")/ 1000)
    seek.setAttribute "max", player.getAttribute("duration")/1000
    container.style.background = "url("+player.getAttribute("artwork")+") no-repeat center center fixed"
    container.style["background-size"] = "cover"

    player.addEventListener "timeupdate", ->
        seek.value = @currentTime
        currentTime.innerHTML = getTimeFromSecs(@currentTime)

    player.addEventListener "playing", ->
        playButton.innerHTML = "&#xf04c;"

    player.addEventListener "pause", ->
        playButton.innerHTML = "&#xf04b;"

    player.addEventListener "ended", ->
        playNext()

    player.play()

getActivePlayer = -> document.getElementsByClassName("active")[0]

getReadyPlayer = ->
    players = document.getElementsByClassName "ready"
    selected = players[Math.floor(Math.random() * players.length)]

preparePlayer = (player) ->
    player.classList.remove "ready"
    player.removeEventListener "progress"
    player.removeEventListener "timeupdate"
    player.removeEventListener "playing"
    player.removeEventListener "pause"
    player.removeEventListener "ended"

    dfd = $.Deferred()
    getRandomSong().done (song) ->
        player.src = song.stream_url
        player.setAttribute "title", song.title
        player.setAttribute "artwork", song.artwork
        player.setAttribute "query", song.query
        player.setAttribute "duration", song.duration
        player.classList.add "ready"
        dfd.resolve(player)
        return

    return dfd.promise()

getRandomSong = () ->
    ###
    1. Get all tracks on SoundCloud for the query
    2. Break the tracks into two arrays - one with a K-POP indicator (genre, tags, or korean characters), one without any indicators
    3. Get top track for whichever array is used (use priority_songs if any in it)
    5. Get artwork, song title, and stream url to create player
    ###
    selected_song = top_queries[Math.floor(Math.random() * top_queries.length)]

    dfd = $.Deferred()
    SC.get '/tracks', {q: selected_song, limit: 200}, (tracks) ->

        # If query returns nothing, return false
        if tracks? and tracks.length is 0
            ret_song = false
            dfd.resolve(ret_song)
            return

        priority_songs = []
        untagged_songs = []
        approved_songs = []

        ###
        BLACKLIST CHECK
        Check all songs to see if the title or tags contain a blaclisted word. All songs that pass the check are added to the approved_songs array.
        ###
        for song in tracks
            blacklisted = 0

            # convert genre, title, and tags to lowercase. Split the song's tag_list into an array instead of a string.
            if not song.genre? then genre = ""
            else genre = song.genre.toLowerCase()

            if not song.title? then title = ""
            else title = song.title.toLowerCase()

            if not song.stream_url? then sURL = ""
            else sURL = song.stream_url

            if not song.tag_list? then tags = []
            else tag_list = song.tag_list.toLowerCase().split(" ")

            # Check title for blacklisted words
            for term in exclude_tags
                if title.indexOf(term) isnt -1
                    blacklisted += 1

            # Check tags for blacklisted words
            for term in exclude_tags
                for tag in tag_list 
                    if tag.indexOf(term) isnt -1
                        blacklisted += 1

            # Check for missing stream_url
            if sURL is "" then blacklisted += 1

            if blacklisted is 0 then approved_songs.push song

        ###
        PRIORITY CHECK
        Check all songs to see if they have indicators that they would be good quality or accurate. If so, put them into the priority array.
        ###
        for song in approved_songs
            # convert genre, title, and tags to lowercase. Split the song's tag_list into an array instead of a string.
            if not song.genre? then genre = ""
            else genre = song.genre.toLowerCase()

            if not song.title? then title = ""
            else title = song.title.toLowerCase()

            if not song.tag_list? then tags = []
            else tag_list = song.tag_list.toLowerCase().split(" ")

            add_criteria = 0

            # Check genre against priority_tags, push to priority array
            if genre in priority_tags
                add_criteria += 1

            # Check tags against priority_tags, push to priority array
            if tag_list.length > 0
                for tag in tag_list
                    if tag in priority_tags and tag not in exclude_tags
                        add_criteria += 1

            # Check song title for korean characters, push to priority array
            if hangul.test(title) is true
                add_criteria += 1

            # If song was priority for some reason, add to priority array. Otherwise, add to untagged array.
            if add_criteria > 0 then priority_songs.push song
            else untagged_songs.push song

        ###
        SORT SONGS
        Sort priority array if there are songs in it, otherwise sort untagged array
        ###

        #Check priority songs array
        if priority_songs.length > 0
            priority_songs.sort (a, b) ->
                keyA = a.playback_count
                keyB = b.playback_count
                return -1 if keyA > keyB
                return 1 if keyA < keyB
                return 0

            track = priority_songs[0]
            artwork = track.artwork_url.replace("-large","-t500x500")
            title = track.title
            duration = track.duration
            stream_url = track.stream_url

        #Check untagged songs array
        else if untagged_songs.length > 0
            untagged_songs.sort (a, b) ->
                keyA = a.playback_count
                keyB = b.playback_count
                return -1 if keyA > keyB
                return 1 if keyA < keyB
                return 0

            track = untagged_songs[0]
            artwork = track.artwork_url.replace("-large","-t500x500")
            title = track.title
            stream_url = track.stream_url
            duration = track.duration

        # return object containing the song information
        if stream_url?
            ret_song = 
                artwork: artwork
                title: title
                duration: duration
                stream_url: stream_url+"?client_id="+client_id
                query: selected_song
        else ret_song = false

        dfd.resolve(ret_song)
        return

    return dfd.promise()

$(document).ready ->
    SC.initialize client_id: client_id

    seek.addEventListener "change", ->
        current = getActivePlayer()
        current.play()
        current.currentTime = seek.value    

    seek.addEventListener "input", ->
        current = getActivePlayer()
        current.pause()
        current.currentTime = seek.value

    nextButton.addEventListener "click", ->
        playNext()

    playButton.addEventListener "click", ->
        active = getActivePlayer()
        if active.paused then active.play()
        else active.pause()   

    preparePlayer(player_one).done (player) ->
        setActivePlayer(player)

        preparePlayer(player_two).done ->
            preparePlayer(player_three).done ->
                preparePlayer(player_four).done ->
                    preparePlayer(player_five).done