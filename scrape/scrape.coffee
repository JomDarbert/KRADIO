request     = require "request"
cheerio     = require "cheerio"
fs          = require "fs"
CronJob = require('cron').CronJob

songs       = []
out_file    = 'songs.json'
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
        $("h2.bkp-toggle-vid").each (i, element) ->
          content = $(this).text().replace("(","").replace(")","").replace("'","").split " – "
          artist = content[0]
          title = content[1]
          query = artist + " " + title
          eyk = artist: artist, title: title, query: query.toLowerCase()
          
          # Push meta-data into parsedResults array
          parsedResults.push eyk
          return

        $("div.song_artist").each (i, element) ->
          artist = $(this).find(".tit_artist a:first-child").text().replace("(","").replace(")","").replace("'","")
          title = $(this).find(".tit_song a").text().replace("(","").replace(")","").replace("'","")
          query = artist + " " + title
          mwave = artist: artist, title: title, query: query.toLowerCase()

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


new CronJob("0 0,12 * * *", ->
  songs = []
  get_data pages, (data) ->
    exists = fs.existsSync out_file
    if exists is true
      fs.unlink out_file, (err) ->
        throw err if err
        console.log "Successfully deleted #{out_file}"
        return

    fs.writeFile out_file, JSON.stringify(data), (err) ->
      throw err if err
      console.log "JSON saved to #{out_file}"
      return
  return
, null, true)