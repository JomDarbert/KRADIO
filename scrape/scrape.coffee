request     = require "request"
cheerio     = require "cheerio"
fs          = require "fs"
CronJob = require('cron').CronJob
###
d = new Date()
date = d.getDate()
month = d.getMonth()
year = d.getFullYear()
###
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
        callback(merged)


update_data = ->
  get_data pages, (data) ->
    fs.readFile out_file, "utf8", "w", (err, in_file) ->
      if err then list = []
      else list = JSON.parse in_file

      entry = date: new Date(), data: data
      list.unshift entry
      if list.length > 100 then list.splice(list.length,1)

      # Sort today's songs by ranking
      compare = (a, b) ->
        ar = Number(a.rank)
        br = Number(b.rank)
        return -1  if ar < br
        return 1  if ar > br
        0
      list[0].data.sort compare

      # Count the number of days song has been in the rankings
      for song,key in list[0].data
        song.rank = key+1
        song.num_days = 0
        song.change = 0
        for entry in list
          for s in entry.data
            if song.query is s.query then song.num_days++

        for old in list[1].data
          if song.query is s.query then song.change = old.rank - song.rank


      fs.writeFile out_file, JSON.stringify(list), (err) ->
        throw err if err
        console.log "JSON saved to #{out_file}"
        return



new CronJob("0 0 * * *", ->
  update_data()
, null, true)