CREATE TABLE `news` (
  `id_news` int(11)  NOT NULL AUTO_INCREMENT,
  `url` varchar(200) DEFAULT NULL,
  `source` varchar(200) DEFAULT NULL,
  `url_encoding` varchar(45) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `keywords` varchar(200) DEFAULT NULL,
  `author` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `crawler_time` datetime DEFAULT NULL,
  `content` longtext,
  `summary` longtext,
  PRIMARY KEY (`id_news`),
  UNIQUE KEY `id_news_UNIQUE` (`id_news`),
  UNIQUE KEY `url_UNIQUE` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;