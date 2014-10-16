###
MWAVE
artoo.scrape('.tit_song a, .tit_artist a:first-child')

artoo.scrape('.item-title, .txt-container div:nth-child(2), .title, .other')

add current time / max time label
###

client_id = "2721807f620a4047d473472d46865f14"
SC.initialize client_id: client_id

priority_tags = ["kpop", "k pop", "k-pop", "korean", "korea"]

exclude_tags = ["cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "cvr"]

hangul = new RegExp "[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|\uD7B0-\uD7FF]"

top_queries =   [   "Madtown YOLO", 
                    "VIXX Error", 
                    "BTOB You're so fly", 
                    "PSY Hangover", 
                    "Boyfriend Witch", 
                    "Raina You End And Me", 
                    "Song Ji Eun Don't look at me like that", 
                    "Ailee Don't touch me", 
                    "Holler Taetiseo", 
                    "The Space Between Soyu", 
                    "Go Crazy 2PM",
                    "Teen Top Missing", 
                    "I Swear Sistar", 
                    "Empty B.I", 
                    "Anticipation Note NS YOON-G", 
                    "Beautiful PARK BO RAM", 
                    "Because I love You VIBE","양화대교 Yanghwa Bridge Zion. T",
                    "Sugar Free T-ara",
                    "소격동 Sogyeokdong IU","Let’s Not Go Crazy 8Eight",
                    "How I Am Kim Dong Ryul",
                    "Darling Girl’s Day",
                    "연애하나 봐 I Think I’m In Love Juniel",
                    "쳐다보지마 Don’t Look At Me Like That Song Ji Eun Secret",
                    "HER Block B",
                    "울컥 All Of A Sudden Krystal",
                    "눈물나는 내 사랑 Teardrop Of My Heart Kim Bum Soo",
                    "A Real Man Swings, Ailee",
                    "너무 보고 싶어 I Miss You So Much Acoustic Collabo",
                    "I Love You Yoon Mi Rae",
                    "MAMACITA Super Junior",
                    "I’ll Remain As A Friend Wheesung, Geeks",
                    "맘마미아 Mamma Mia Kara",
                    "The Day Noel",
                    "You’re So Fly BTOB",
                    "괜찮아 사랑이야 It’s Okay, That’s Love Davichi",
                    "Give Your Love? SPICA.S",
                    "I’m Fine Thank You Ladies’ Code",
                    "Still I’m By Your Side Clazziquai",
                    "Love Fiction Ulala Session",
                    "Body Language feat. Bumkey San E",
                    "눈, 코, 입 Eyes, Nose, Lips Taeyang",
                    "잠 못드는 밤 Sleepless Night feat. Punch Crush",
                    "노크 KNOCK Nasty Nasty",
                    "최고의 행운 Best Luck Chen EXO-M",
                    "컬러링 Color Ring WINNER",
                    "Love Me feat. Kim Tae Chun Linus’ Blanket",
                    "두 번 죽이는 말 Words To Kill Monday Kiz",
                    "Cha-Ga-Wa F.Cuz","빨개요 Red HyunA",
                    "그 한 사람 That One Person Lee Seung Hwan",
                    "Difficult Woman Jang Bum Joon",
                    "자전거 Bicycle Gary, Jung In",
                    "Pitiful feat. Hip Job Gavy NJ",
                    "Everyone Else But Me Yoo Seung Woo",
                    "가을냄새 I Smell The Autumn  Verbal Jint"
                ]


currently_playing = null
player = document.getElementById("player")



playRandom = ->
    # Choose a random song to play. If that song is currently playing, choose a new random song until a song is found that is not currently playing.
    loop
        selected_song = top_queries[Math.floor(Math.random()*top_queries.length)]
        break unless selected_song is currently_playing

    # Set the currently playing song 
    currently_playing = selected_song

    ###
    1. Get all tracks on SoundCloud for the query
    2. Break the tracks into two arrays - one with a K-POP indicator (genre, tags, or korean characters), one without any indicators
    3. Get top track for whichever array is used (use priority_songs if any in it)
    5. Get artwork, song title, and stream url to create player
    ###

    SC.get '/tracks', {q: selected_song}, (tracks) ->

        # If query returns nothing, try to find a different song
        if tracks? and tracks.length is 0 then playRandom() 

        # Otherwise, break the found tracks into two arrays
        else
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
                genre = track.genre
                tags = track.tag_list

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

            else alert "There was a problem!"

            # Setup player
            $("#player").attr "src", stream_url + "?client_id=" + client_id
            $("#title").text title
            $('#seek').attr "max", duration/1000
            $("#container").css "background-size", "cover"
            $("#container").css "-webkit-background-size", "cover"
            $("#container").css "background", "url("+artwork+") no-repeat center center fixed"
        return

    return



playPause = ->
  if player.paused
    player.play()
    playButton.className = ""
    playButton.className = "fa fa-pause fa-5x"
  else
    player.pause()
    playButton.className = ""
    playButton.className = "fa fa-play fa-5x"
  return

$(document).bind "onMediaTimeUpdate.scPlayer", (event) ->
  console.log event.target, "the track is at " + event.position + " out of " + event.duration + " which is " + event.relative + " of the total"
  return

player.addEventListener("timeupdate", ->
    $('#seek').val(player.currentTime)
)

$('#seek').on("input", ->
    player.pause()
    player.currentTime = $('#seek').val()
)

$('#seek').on("change", ->
    player.play()
    player.currentTime = $('#seek').val()
)

$("#nextButton").click -> 
    playRandom()

$("#playButton").click -> 
    playPause()

$(document).ready ->
    playRandom()