var crawler_request = require('request');
var crawler_iconv = require('iconv-lite');
var crawler_cheerio = require('cheerio');
require('date-utils');

// 连接数据库
var crawler_sql = require("./crawler_sql.js");

// 定时执行
var crawler_schedule = require('node-schedule');
var crawler_rule = new crawler_schedule.RecurrenceRule();
// crawler_rule.hour = [0, 12];
// crawler_rule.minute = 5;
crawler_rule.second = 0;
crawler_schedule.scheduleJob(crawler_rule, function() {
    crawler();
});

// 定时爬取网页首页
function request(url, callback) {
    var options = {
        url: url,
        encoding: null,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
        },
        timeout: 10000
    }
    crawler_request(options, callback);
};

var crawler_url = 'https://news.sina.com.cn/';

function crawler() {
    request(crawler_url, function(err, res, body) {
        // 网页解析
        try {
            // 编码转换
            var url_encoding = 'UTF-8';
            var url_html = crawler_iconv.decode(body, url_encoding);
            //解析网页
            var $ = crawler_cheerio.load(url_html, { decodeEntities: true });
        } catch (e) {
            console.log('页面解码错误：' + e);
        }
        // 判断网页是否存在超链接
        var url_hrefs;
        try {
            url_hrefs = eval("$('a')");
        } catch (e) {
            console.log('页面不存在超链接' + e);
        }
        // 遍历网页中所有超链接
        url_hrefs.each(function(i, e) {
            // 获取新闻
            var news_url = "";
            try {
                var url_href = "";
                url_href = $(e).attr("href");
                if (typeof(url_href) == "undefined") {
                    return true;
                }
                if (url_href.toLowerCase().indexOf('http://') >= 0 || url_href.toLowerCase().indexOf('https://') >= 0) {
                    news_url = url_href;
                } else if (url_href.startsWith('//')) {
                    news_url = 'https:' + url_href;
                } else {
                    news_url = crawler_url.substr(0, crawler_url.lastIndexOf('/') + 1) + url_href;
                }
            } catch (e) {
                console.log('获取新闻页面出错' + e);
            }
            // 检验新闻网页url是否符合url命名格式
            var news_reg = /\/(\d{4})-(\d{2})-(\d{2})\/doc-([a-zA-Z0-9]{15}).shtml/;
            // 如：https://news.sina.com.cn/c/xl/2021-04-29/doc-ikmyaawc2421496.shtml
            if (!news_reg.test(news_url)) {
                console.log('新闻链接不符合格式！');
                return;
            }
            // 爬取新闻页面
            var news_search_sql = 'select url from news where url=?';
            var news_search = [news_url];
            crawler_sql.query(news_search_sql, news_search, function(qerr, vals, fields) {
                if (vals.length > 0) {
                    console.log('该新闻页面已被爬取！')
                } else {
                    crawler_news_url(news_url);
                }
            });
        });
    });
}

// 爬取新闻链接
function crawler_news_url(news_url) {
    request(news_url, function(err, res, body) {
        // 网页解析
        try {
            // 编码转换
            var url_encoding = 'UTF-8';
            var url_html = crawler_iconv.decode(body, url_encoding);
            //解析网页
            var $ = crawler_cheerio.load(url_html, { decodeEntities: true });
        } catch (e) {
            console.log('页面解码错误：' + e);
        }
        // 定义新闻信息json
        var news = {};
        news.crawler_time = (new Date()).toFormat("YYYY-MM-DD HH:MM:SS.SSSS");
        news.url = news_url;
        news.url_encoding = 'UTF-8';
        news.keywords = '';
        news.title = '';
        news.date = new Date();
        news.author = '';
        news.source = '';
        news.summary = '';
        news.content = '';
        // 获取新闻关键词
        try {
            news.keywords = eval("$('meta[name=\"keywords\"]').eq(0).attr(\"content\")");
        } catch (e) {
            console.log('新闻关键词获取错误：' + e);
        }
        // 获取新闻标题
        try {
            news.title = eval("$('title').text()").replace(/[\r\n\s]/g, "");
        } catch (e) {
            console.log('新闻标题获取错误：' + e);
        }
        // 获取新闻时间
        try {
            news.date = eval("$('.date').text()");
            news.date = news.date.replace('年', '-');
            news.date = news.date.replace('月', '-');
            news.date = news.date.replace('日', '');
        } catch (e) {
            console.log('新闻日期获取错误：' + e);
        }
        // 获取新闻作者
        try {
            news.author = eval("$('.show_author').text()").replace("责任编辑：", "");
        } catch (e) {
            console.log('新闻作者获取错误：' + e);
        }
        // 获取新闻来源
        try {
            news.source = eval("$('meta[name=\"mediaid\"]').eq(0).attr(\"content\")");
        } catch (e) {
            console.log('新闻来源获取错误：' + e);
        }
        // 获取新闻摘要
        try {
            news.summary = eval("$('meta[name=\"description\"]').eq(0).attr(\"content\")").replace(/[\r\n\s]/g, "");
            if (news.summary == "") {
                news.summary = eval("$('meta[property=\"og:description\"]').eq(0).attr(\"content\")").replace(/[\r\n\s]/g, "");
            }
        } catch (e) {
            console.log('新闻摘要获取错误：' + e);
        }
        // 获取新闻内容
        try {
            news.content = eval("$('.article').text()").replace(/[\r\n\s]/g, "");
            if (news.content == "") {
                news.content = eval("$('#article_content').text()").replace(/[\r\n\s]/g, "");
            }
        } catch (e) {
            console.log('新闻内容获取错误：' + e);
        }
        console.log(JSON.stringify(news));

        // 写入数据库
        if (news.author == '' || news.author == null) {
            news.author = news.source;
        }
        if (news.content != '' && news.source != '') {
            var news_add_sql = 'INSERT INTO news(url, source, url_encoding, title, keywords, author, date, crawler_time, summary, content) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            var news_add = [news.url, news.source, news.url_encoding,
                news.title, news.keywords, news.author, news.date,
                news.crawler_time, news.summary, news.content
            ];
            crawler_sql.query(news_add_sql, news_add, function(qerr, vals, fields) {
                if (qerr) {
                    console.log(qerr);
                }
            });
        }
    });
}