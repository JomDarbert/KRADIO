var CronJob,cheerio,fs,get_data,get_old_lists,len,list,out_file,pages,request,songs;request=require("request"),cheerio=require("cheerio"),fs=require("fs"),CronJob=require("cron").CronJob,songs=[],out_file="songs.json",pages=["http://www.eatyourkimchi.com/kpopcharts/","http://www.eatyourkimchi.com/kpopcharts/page/2/","http://www.eatyourkimchi.com/kpopcharts/page/3/","http://www.eatyourkimchi.com/kpopcharts/page/4/","http://www.eatyourkimchi.com/kpopcharts/page/5/","http://www.eatyourkimchi.com/kpopcharts/page/6/","http://www.eatyourkimchi.com/kpopcharts/page/7/","http://www.eatyourkimchi.com/kpopcharts/page/8/","http://www.eatyourkimchi.com/kpopcharts/page/9/","http://www.eatyourkimchi.com/kpopcharts/page/10/","http://mwave.interest.me/kpop/chart.m"],get_data=function(t,e){var r,i,o,a,s;for(s=[],o=0,a=t.length;a>o;o++)i=t[o],r=0,s.push(request(i,function(t,e,r){var i,o;t||200!==e.statusCode||(i=cheerio.load(r),o=[],i("div.bkp-listing").each(function(){var t,e,r,a,s,p;e=i(this).find("h2.bkp-toggle-vid").text().replace("(","").replace(")","").replace("'","").split(" – "),t=e[0],p=e[1],a=t+" "+p,s=i(this).find("span.bkp-vid-rank").text(),r={artist:t,title:p,query:a.toLowerCase(),rank:s},o.push(r)}),i("div.song_artist").each(function(){var t,e,r,a,s;t=i(this).find(".tit_artist a:first-child").text().replace("(","").replace(")","").replace("'",""),s=i(this).find(".tit_song a").text().replace("(","").replace(")","").replace("'",""),a=i(this).find("td.nb em").text(),r=t+" "+s,e={artist:t,title:s,query:r.toLowerCase(),rank:a},o.push(e)}),songs.push(o))}).on("end",function(){var t;return r++,r===pages.length?(t=[],t=t.concat.apply(t,songs),e(t)):void 0}));return s},get_old_lists=function(){var t,e;return e=fs.existsSync(out_file),e===!1&&fs.writeFileSync(out_file,""),t=fs.readFileSync(out_file,"utf-8")},list=JSON.parse(get_old_lists()),len=list.length,console.log(len);