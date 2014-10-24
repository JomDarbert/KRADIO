import scrapy

from tutorial.items import DmozItem

class DmozSpider(scrapy.Spider):
    name = "dmoz"
    allowed_domains = ["mwave.interest.me"]
    start_urls = [
        "http://mwave.interest.me/kpop/chart.m"
    ]

    def parse(self, response):
        for sel in response.xpath('//div[@class="song_artist"]'):
            item = DmozItem()
            item['title'] = sel.xpath('h2[@class="tit_song"]/a/text()').extract()
            item['artist'] = sel.xpath('p[@class="tit_artist"]/a[1]/text()').extract()
            yield item