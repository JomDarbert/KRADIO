import scrapy

from tutorial.items import DmozItem

class DmozSpider(scrapy.Spider):
    name = "dmoz"
    allowed_domains = ["eatyourkimchi.com"]
    start_urls = [
        "http://www.eatyourkimchi.com/kpopcharts/",
        "http://www.eatyourkimchi.com/kpopcharts/page/2/",
        "http://www.eatyourkimchi.com/kpopcharts/page/3/",
        "http://www.eatyourkimchi.com/kpopcharts/page/4/",
        "http://www.eatyourkimchi.com/kpopcharts/page/5/",
        "http://www.eatyourkimchi.com/kpopcharts/page/6/",
        "http://www.eatyourkimchi.com/kpopcharts/page/7/",
        "http://www.eatyourkimchi.com/kpopcharts/page/8/",
        "http://www.eatyourkimchi.com/kpopcharts/page/9/",
        "http://www.eatyourkimchi.com/kpopcharts/page/10/",
    ]

    def parse(self, response):
        for sel in response.xpath('//h2[@class="bkp-toggle-vid"]'):
            item = DmozItem()
            item['title'] = sel.xpath('text()').extract()[0].encode('ascii', errors='ignore').replace("  ", " ")
            yield item