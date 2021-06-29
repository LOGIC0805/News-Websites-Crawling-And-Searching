require('date-utils');
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(express.static(__dirname + '/static'));
app.use(cookieParser());

// 连接数据库
var crawler_sql = require("./crawlers/crawler_sql.js");

app.get('/login.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "login.html");
})

app.get('/register.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "register.html");
})

app.get('/forget.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "forget.html");
})

app.get('/users.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "users.html");
})

app.get('/users_action.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "users_action.html");
})

app.get('/search.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "search.html");
})

app.get('/news.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "news.html");
})

app.get('/news_info.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "news_info.html");
})

app.get('/charts.html', function(req, res) {
    res.sendFile(__dirname + "/templates/" + "charts.html");
})

app.get('/login_user', function(req, res) {
    var phonenum = req.query.phonenum;
    var password = req.query.password;
    var userinfo_search_sql = "select username, password, status from userinfo where phonenum = " + phonenum;
    crawler_sql.query(userinfo_search_sql, function(err, result, fields)  {
        if (result.length > 0) {
            if (result[0].status == 1) {
                var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
                var time = new Date();
                var useraction_add = [phonenum, "login prohibited", time];
                crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                    if (qerr) {
                        console.log(qerr);
                    }
                });
                res.json({code: 0, msg: "账号已被停用，登录失败！"});
            } else if (result[0].password == password) {
                var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
                var time = new Date();
                var useraction_add = [phonenum, "login successfully", time];
                crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                    if (qerr) {
                        console.log(qerr);
                    }
                });
                // res.cookie("username", result[0].username, {maxAge:60000});
                res.cookie("phonenum", phonenum);
                res.json({code: 1, msg: "登录成功！"});
            } else {
                res.json({code: 0, msg: "密码错误，登录失败！"});
            }
        } else {
            res.json({code: 0, msg: "手机号未注册，登录失败！"});
        }
    });    
})

app.get('/register_user', function(req, res) {
    var phonenum = req.query.phonenum;
    var username = req.query.username;
    var password = req.query.password;
    var userinfo_search_sql = "select phonenum from userinfo where phonenum = " + phonenum;
    crawler_sql.query(userinfo_search_sql, function(err, result, fields)  {
        if (result.length == 0) {
            var userinfo_add_sql = 'INSERT INTO userinfo(phonenum, username, password, status) VALUES(?, ?, ?, ?)';
            var userinfo_add = [phonenum, username, password, 0];
            crawler_sql.query(userinfo_add_sql, userinfo_add, function(qerr, vals, fields) {
                if (qerr) {
                    console.log(qerr);
                    res.json({code: 0, msg: "系统出现问题，注册失败！"});
                }
            });
            var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
            var time = new Date();
            var useraction_add = [phonenum, "register successfully", time];
            crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                if (qerr) {
                    console.log(qerr);
                }
            });
            res.json({code: 1, msg: "注册成功！"});
        } else {
            res.json({code: 0, msg: "手机号已被注册，注册失败！"});
        }
    });    
})

app.get('/change_password', function(req, res) {
    var phonenum = req.query.phonenum;
    var username = req.query.username;
    var password = req.query.password;
    var userinfo_search_sql = "select phonenum, username from userinfo where phonenum = " + phonenum;
    crawler_sql.query(userinfo_search_sql, function(err, result, fields) {
        if (result.length > 0) {
            if (result[0].username == username) {
                var userinfo_change_sql = 'UPDATE userinfo SET password = ? where phonenum = ?';
                var userinfo_change = [password, phonenum];
                crawler_sql.query(userinfo_change_sql, userinfo_change, function(qerr, vals, fields) {
                    if (qerr) {
                        console.log(qerr);
                        res.json({code: 0, msg: "系统出现问题，修改失败！"});
                    }
                });
                var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
                var time = new Date();
                var useraction_add = [phonenum, "change password successfully", time];
                crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                    if (qerr) {
                        console.log(qerr);
                    }
                });
                res.json({code: 1, msg: "修改成功！"});
            } else {
                var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
                var time = new Date();
                var useraction_add = [phonenum, "change password failed", time];
                crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                    if (qerr) {
                        console.log(qerr);
                    }
                });
                res.json({code: 0, msg: "用户名错误，修改失败！"});
            }
        } else {
            res.json({code: 0, msg: "手机号未注册，修改失败！"});
        }
    });    
})

var news_list = [];
var search_info_past = "";
var search_type_past = "";

var max_page = 5;
var min_news_per_page = 8;
var page_num = 1;

app.get('/news_page', function(req, res) {
    page_num = req.query.page_num;
    res.json({code: 1});
})

app.get('/clear_search', function(req, res) {
    search_info_past = "";
    search_type_past = "";
    news_list = [];
    page_num = 1;
    res.json({code: 1});
})

app.get('/search_news', function(req, res) {
    // 查询数据库
    var search_type = req.query.search_type;
    var search_info = req.query.search_info;
    var search_info1 = req.query.search_info1;
    var search_bool = req.query.search_bool;
    var search_sort = req.query.search_sort;
    var news_search_sql = "";
    if (search_bool == 'NONE') {
        if (search_type == 'title') {
            news_search_sql = "select id_news, url, source, title, author, date from news where title like '%" + search_info + "%'";
        } else if (search_type == 'content') {
            news_search_sql = "select id_news, url, source, title, author, date from news where content like '%" + search_info + "%'";
        }
    } else if (search_bool == 'AND') {
        if (search_type == 'title') {
            news_search_sql = "select id_news, url, source, title, author, date from news where title like '%" + search_info + "%' and " + "title like '%" + search_info1 + "%'";
        } else if (search_type == 'content') {
            news_search_sql = "select id_news, url, source, title, author, date from news where content like '%" + search_info + "%' and " + "title like '%" + search_info1 + "%'";
        }
    } else if (search_bool == 'OR') {
        if (search_type == 'title') {
            news_search_sql = "select id_news, url, source, title, author, date from news where title like '%" + search_info + "%' or " + "title like '%" + search_info1 + "%'";
        } else if (search_type == 'content') {
            news_search_sql = "select id_news, url, source, title, author, date from news where content like '%" + search_info + "%' or " + "title like '%" + search_info1 + "%'";
        }
    }
    if (search_sort == "按照时间升序") {
        news_search_sql += " order by date";
    } else if (search_sort == "按照时间降序") {
        news_search_sql += " order by date DESC";
    }
    crawler_sql.query(news_search_sql, function(err, result, fields) {
        if (result.length > 0) {
            news_list = result;
            page_num = 1;
            search_info_past = search_info;
            search_type_past = search_type;
            var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
            var time = new Date();
            var phonenum = req.cookies['phonenum'];
            var useraction_add = [phonenum, "search " + search_type + " [" + search_info + "] successfully", time];
            crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                if (qerr) {
                    console.log(qerr);
                }
            });
            res.json({code: 1, msg: "查询成功！"});
        } else {
            search_info_past = "";
            search_type_past = "";
            news_list = [];
            page_num = 1;
            var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
            var time = new Date();
            var phonenum = req.cookies['phonenum'];
            var useraction_add = [phonenum, "search " + search_type + " [" + search_info + "] failed", time];
            crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
                if (qerr) {
                    console.log(qerr);
                }
            });
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
            if (result.length > max_page * min_news_per_page) {
                var news_per_page = Math.floor(result.length / max_page);
                var begin_news =  news_per_page + result.length % max_page;
                if (page_num == 1) {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice(0, begin_news), page_num: page_num, pages: max_page});
                } else {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice(begin_news + (page_num - 2) * news_per_page, begin_news + (page_num - 1) * news_per_page), page_num: page_num, pages: max_page});
                }
            } else {
                var pages = Math.ceil(result.length / min_news_per_page);
                if (page_num == pages) {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice((pages - 1) * min_news_per_page, result.length), page_num: page_num, pages: pages});
                } else {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice((page_num - 1) * min_news_per_page, page_num * min_news_per_page), page_num: page_num, pages: pages});
                }
            }
        });
    } else {
        var news_search_sql = "";
        if (search_type == 'title') {
            news_search_sql = "select date, count(*) as cnt from news where title like '%" + search_info + "%' group by date order by date";
        } else if (search_type == 'content') {
            news_search_sql = "select date, count(*) as cnt from news where content like '%" + search_info + "%' group by date order by date";
        }
        crawler_sql.query(news_search_sql, function(err, result, fields) {
            if (news_list.length > max_page * min_news_per_page) {
                var news_per_page = Math.floor(news_list.length / max_page);
                var begin_news =  news_per_page + news_list.length % max_page;
                if (page_num == 1) {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice(0, begin_news), page_num: page_num, pages: max_page});
                } else {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice(begin_news + (page_num - 2) * news_per_page, begin_news + (page_num - 1) * news_per_page), page_num: page_num, pages: max_page});
                }
            } else {
                var pages = Math.ceil(news_list.length / min_news_per_page);
                if (page_num == pages) {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice((pages - 1) * min_news_per_page, news_list.length), page_num: page_num, pages: pages, news_statistics: result});
                } else {
                    res.json({search_info: search_info, search_type: search_type, news_list: news_list.slice((page_num - 1) * min_news_per_page, page_num * min_news_per_page), page_num: page_num, pages: pages, news_statistics: result});
                }
            }
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
    var useraction_add_sql = 'INSERT INTO useraction(phonenum, action, time) VALUES(?, ?, ?)';
    var time = new Date();
    var phonenum = req.cookies['phonenum'];
    var useraction_add = [phonenum, "view [" + news_info[0].url + "] news details successfully", time];
    crawler_sql.query(useraction_add_sql, useraction_add, function(qerr, vals, fields) {
        if (qerr) {
            console.log(qerr);
        }
    });
    res.json(news_info[0]);
})

app.get('/show_users', function(req, res) {
    var userinfo_search_sql = "select phonenum, username, status, id_userinfo from userinfo";
    crawler_sql.query(userinfo_search_sql, function(err, result, fields) {
        res.json(result);
    });
})

app.get('/change_status', function(req, res) {
    var phonenum = req.query.phonenum;
    var status = req.query.status;
    if (status == "0") {
        status = 1;
    } else if (status == "1") {
        status = 0;
    }
    var userinfo_change_sql = 'UPDATE userinfo SET status = ? where phonenum = ?';
    var userinfo_change = [status, phonenum];
    crawler_sql.query(userinfo_change_sql, userinfo_change, function(qerr, vals, fields) {
        if (qerr) {
            console.log(qerr);
        }
    });
    res.json({code: 1});
})

var user_action = []
app.get('/user_action', function(req, res) {
    var phonenum = req.query.phonenum;
    var useraction_search_sql = "select phonenum, time, action, id_useraction from useraction where phonenum = " + phonenum;
    crawler_sql.query(useraction_search_sql, function(err, result, fields) {
        user_action = result;
        res.json({code: 1});
    });
})

app.get('/show_user_action', function(req, res) {
    res.json(user_action);
})

app.get('/chart_date_num', function(req, res) {
    news_search_sql = "select date, count(*) as cnt from news group by date order by date";
    crawler_sql.query(news_search_sql, function(err, result, fields) {
        var x = [];
        var y = [];
        for (var i = 0; i < result.length; i++) {
            x.push(result[i].date.toString().slice(0, 10));
            y.push(result[i].cnt);
        }
        res.json({x: x, y: y});
    });
})

app.get('/chart_pos_num', function(req, res) {
    news_search_sql = "select source, count(*) as cnt from news group by source order by source";
    crawler_sql.query(news_search_sql, function(err, result, fields) {
        var x = [];
        var y = [];
        for (var i = 0; i < result.length; i++) {
            x.push(result[i].source);
            y.push(result[i].cnt);
        }
        res.json({x: x, y: y});
    });
})

app.get('/chart_login_time', function(req, res) {
    useraction_search_sql = "select time, count(*) as cnt from useraction where action like '%" + "login successfully" + "%' group by time order by time";
    crawler_sql.query(useraction_search_sql, function(err, result, fields) {
        var x1 = [];
        var y1 = [];
        for (var i = 0; i < result.length; i++) {
            x1.push(result[i].time.toString().slice(0, 10));
            y1.push(result[i].cnt);
        }
        var x = [];
        var y = [];
        var tmp = x1[0];
        var cnt = y1[0];
        for (var i = 1; i < x1.length - 1; i++) {
            if (tmp == x1[i]) {
                cnt += y1[i];
            } else {
                x.push(tmp);
                y.push(cnt);
                tmp = x1[i];
                cnt = y1[i];
            }
        }
        x.push(tmp);
        y.push(cnt);
        res.json({x: x, y: y});
    });
})

app.get('/chart_search_time', function(req, res) {
    useraction_search_sql = "select time, count(*) as cnt from useraction where action like '%" + "search" + "%' group by time order by time";
    crawler_sql.query(useraction_search_sql, function(err, result, fields) {
        var x1 = [];
        var y1 = [];
        for (var i = 0; i < result.length; i++) {
            x1.push(result[i].time.toString().slice(0, 10));
            y1.push(result[i].cnt);
        }
        var x = [];
        var y = [];
        var tmp = x1[0];
        var cnt = y1[0];
        for (var i = 1; i < x1.length - 1; i++) {
            if (tmp == x1[i]) {
                cnt += y1[i];
            } else {
                x.push(tmp);
                y.push(cnt);
                tmp = x1[i];
                cnt = y1[i];
            }
        }
        x.push(tmp);
        y.push(cnt);
        res.json({x: x, y: y});
    });
})

var server = app.listen(8080, function() {
    console.log("访问地址为 http://127.0.0.1:8080/login.html")
})