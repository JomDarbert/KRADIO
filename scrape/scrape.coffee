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

        $("div.song_artist").each (i, element) ->
          artist = $(this).find(".tit_artist a:first-child").text().replace("(","").replace(")","").replace("'","")
          title = $(this).find(".tit_song a").text().replace("(","").replace(")","").replace("'","")
          rank = $(this).find("td.nb em").text()
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


get_old_lists = ->
  exists = fs.existsSync out_file
  if exists is false then fs.writeFileSync out_file, ""
  return data = fs.readFileSync out_file, "utf-8"

list = JSON.parse get_old_lists()
len = list.length

console.log len

# NEED TO WRITE EACH DAY'S PULL TO A NEW ITEM IN THE LIST. ONLY KEEP THE PAST xxxx DAYS.

###
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
###