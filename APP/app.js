var express = require('express');
var app = express();
app.use(express.static(__dirname + '/static'));

// 连接数据库
var crawler_sql = require("./crawlers/crawler_sql.js");

app.get('/search.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "search.html");
})

app.get('/news.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "news.html");
})

app.get('/news_info.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "news_info.html");
})

var news_list = [];
var search_info_past = "";
var search_type_past = "";

app.get('/search_news', function(req, res) {
    // 查询数据库
    var search_type = req.query.search_type;
    var search_info = req.query.search_info;
    var news_search_sql = "";
    if (search_type == 'title') {
        news_search_sql = "select id_news, url, source, title, author, date from news where title like '%" + search_info + "%'";
    } else if (search_type == 'content') {
        news_search_sql = "select id_news, url, source, title, author, date from news where content like '%" + search_info + "%'";
    }
    crawler_sql.query(news_search_sql, function(err, result, fields) {
        if (result.length > 0) {
            news_list = result;
            search_info_past = search_info;
            search_type_past = search_type;
            res.json({code: 1, msg: "查询成功！"});
        } else {
            search_info_past = "";
            search_type_past = "";
            news_list = [];
            res.json({code: 0, msg: "相关新闻不存在，请更换信息查询！"});
        }
    });
})

app.get('/show_news', function(req, res) {
    var search_info = search_info_past;
    var search_type = search_type_past;
    if (news_list.length == 0 || search_info_past == "") {
        var news_search_sql = "select id_news, url, source, title, author, date from news";
        search_info_past = "";
        search_type_past = "";
        crawler_sql.query(news_search_sql, function(err, result, fields) {
            news_list = result;
            res.json({search_info: search_info, search_type: search_type, news_list: news_list});
        });
    } else {
        var news_search_sql = "";
        search_info_past = "";
        search_type_past = "";
        if (search_type == 'title') {
            news_search_sql = "select date, count(*) as cnt from news where title like '%" + search_info + "%' group by date order by date";
        } else if (search_type == 'content') {
            news_search_sql = "select date, count(*) as cnt from news where content like '%" + search_info + "%' group by date order by date";
        }
        crawler_sql.query(news_search_sql, function(err, result, fields) {
            res.json({search_info: search_info, search_type: search_type, news_list: news_list, news_statistics: result});
        });
    }
})

var news_info = [];
app.get('/news_info', function(req, res) {
    var news_search_sql = "select url, source, title, keywords, author, date, crawler_time, summary, content from news where id_news=?";
    var news_search = [req.query.id_news];
    crawler_sql.query(news_search_sql, news_search, function(err, result, fields) {
        news_info = result;
        res.json({code: 1});
    });
})

app.get('/show_news_info', function(req, res) {
    res.json(news_info[0]);
})

var server = app.listen(8080, function() {
    console.log("访问地址为 http://127.0.0.1:8080/search.html")
})