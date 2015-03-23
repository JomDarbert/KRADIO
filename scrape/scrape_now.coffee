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

get_data = (urls, callback) ->
  for page in urls
    count = 0

    request(page, (error, response, html) ->
      if not error and response.statusCode is 200
        $ = cheerio.load(html)

        parsedResults = []

        $("div.list_song tr").each (i, element) ->
          artist = $(this).find(".tit_artist a:first-child").text().replace("(","").replace(")","").replace("'","")
          title = $(this).find(".tit_song a").text().replace("(","").replace(")","").replace("'","")
          rank = $(this).find(".nb em").text()
          query = artist + " " + title

          if artist? and artist isnt ""
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
    console.log data

    for song,key in data
      song.rank = key+1
      song.change = 0
      song.num_days = 0

    # JSON Backup
    fs.writeFile out_file, JSON.stringify(data), (err) ->
      throw err if err
      console.log "JSON saved to #{out_file}"
      return

      request.post
        url: "http://jombly.com:3000/update"
        body: JSON.stringify data
        headers: {"Content-Type": "application/json;charset=UTF-8"}
      , (error, response, body) ->
        console.log error
        console.log response.statusCode
        console.log body
        return


update_data()
