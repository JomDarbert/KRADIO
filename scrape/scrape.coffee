http        = require "http"
request     = require "request"
cheerio     = require "cheerio"
fs          = require "fs"
CronJob     = require('cron').CronJob
songs       = []
out_file    = "songs.json"
pages       = [ "http://www.eatyourkimchi.com/kpopcharts/",
                "http://www.eatyourkimchi.com/kpopcharts/page/2/",
                "http://www.eatyourkimchi.com/kpopcharts/page/3/",
                "http://www.eatyourkimchi.com/kpopcharts/page/4/",
                "http://www.eatyourkimchi.com/kpopcharts/page/5/",
                "http://www.eatyourkimchi.com/kpopcharts/page/6/",
                "http://www.eatyourkimchi.com/kpopcharts/page/7/",
                "http://www.eatyourkimchi.com/kpopcharts/page/8/",
                "http://www.eatyourkimchi.com/kpopcharts/page/9/",
                "http://www.eatyourkimchi.com/kpopcharts/page/10/",
                "http://mwave.interest.me/kpop/chart.m"
              ]

levenstein = (->
  row2 = []
  (s1, s2) ->
    if s1 is s2
      0
    else
      s1_len = s1.length
      s2_len = s2.length
      if s1_len and s2_len
        i1 = 0
        i2 = 0
        a = undefined
        b = undefined
        c = undefined
        c2 = undefined
        row = row2
        row[i1] = ++i1  while i1 < s1_len
        while i2 < s2_len
          c2 = s2.charCodeAt(i2)
          a = i2
          ++i2
          b = i2
          i1 = 0
          while i1 < s1_len
            c = a + ((if s1.charCodeAt(i1) isnt c2 then 1 else 0))
            a = row[i1]
            b = (if b < a then ((if b < c then b + 1 else c)) else ((if a < c then a + 1 else c)))
            row[i1] = b
            ++i1
        b
      else
        s1_len + s2_len
)()

sortQuery = (a, b) ->
  aq = a.query
  bq = b.query
  return -1  if aq < bq
  return 1  if aq > bq
  0

sortRank = (a, b) ->
  ar = Number(a.rank)
  br = Number(b.rank)
  return -1  if ar < br
  return 1  if ar > br
  0

get_data = (urls, callback) ->
  for page in urls
    count = 0

    request(page, (error, response, html) ->
      if not error and response.statusCode is 200
        $ = cheerio.load(html)

        parsedResults = []
        $("div.bkp-listing").each (i, element) ->
          content = $(this).find("h2.bkp-toggle-vid").text().replace("(","").replace(")","").replace("'","").split " – "
          artist = content[0]
          title = content[1]
          query = artist + " " + title
          rank = $(this).find("span.bkp-vid-rank").text()
          eyk = artist: artist, title: title, query: query.toLowerCase(), rank: rank
          
          # Push meta-data into parsedResults array
          parsedResults.push eyk
          return

        $("div.list_song tr").each (i, element) ->
          artist = $(this).find(".tit_artist a:first-child").text().replace("(","").replace(")","").replace("'","")
          title = $(this).find(".tit_song a").text().replace("(","").replace(")","").replace("'","")
          rank = $(this).find(".nb em").text()
          query = artist + " " + title
          mwave = artist: artist, title: title, query: query.toLowerCase(), rank: rank
          # Push meta-data into parsedResults array
          parsedResults.push mwave
          return

        songs.push parsedResults
      return
    ).on "end", ->
      count++
      if count is pages.length
        merged = []
        merged = merged.concat.apply(merged, songs)

        # Remove any empty
        i = 0
        len = merged.length
        while i < len
          merged[i] and merged.push(merged[i])
          i++
        merged.splice(0,len)


        callback(merged)




update_data = ->
  get_data pages, (data) ->
    # Remove duplicates by using levenstein score
    data.sort sortQuery

    a = []
    prev = ""
    i = 0

    while i < data.length
      lev = levenstein(data[i].query,prev.query || "")
      if lev > 6
        a.push data[i]
      prev = data[i]
      i++

    to_file = a

    # Sort today's songs by ranking
    to_file.sort sortRank
    for song,key in to_file
      song.rank = key+1
      song.change = 0
      song.num_days = 0

    # Put temp variable back into list object
    fs.readFile out_file, "utf8", "w", (err, in_file) ->
      if err then list = []
      else list = JSON.parse in_file

      # Set new entry and make sure list of entries doesn't exceed 50 days
      entry = date: new Date, data: to_file
      list.unshift entry
      if list.length > 2 then list.pop()

      if list.length > 1
        for song in list[0].data

          # Get change in rank from last week
          for i in list[1].data
            if i.query is song.query
              song.change = i.rank - song.rank

          # Get count of days on chart
          for j in list[1].data
            if j.query is song.query
              song.num_days = j.num_days+1

      # JSON Backup
      fs.writeFile out_file, JSON.stringify(list), (err) ->
        throw err if err
        console.log "JSON saved to #{out_file}"
        return
      ###
      request.post
        url: "http://www.jombly.com:3000/update"
        body: JSON.stringify list
        headers: {"Content-Type": "application/json;charset=UTF-8"}
      , (error, response, body) ->
        console.log response.statusCode
        return
      ###

# Once per day at midnight
new CronJob("0 0 * * *", ->
  update_data()
, null, true)
