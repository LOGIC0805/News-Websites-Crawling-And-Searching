// 连接数据库
var crawler_sql = require("mysql");
var pool = crawler_sql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'crawl'
});
var query = function(sql, sqlparam, callback) {
    pool.getConnection(function(err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, sqlparam, function(qerr, vals, fields) {
                conn.release(); //释放连接 
                callback(qerr, vals, fields); //事件驱动回调 
            });
        }
    });
};
var query_noparam = function(sql, callback) {
    pool.getConnection(function(err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, function(qerr, vals, fields) {
                conn.release(); //释放连接 
                callback(qerr, vals, fields); //事件驱动回调 
            });
        }
    });
};
exports.query = query;
exports.query_noparam = query_noparam;