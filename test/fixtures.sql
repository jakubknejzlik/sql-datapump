DROP TABLE IF EXISTS `users`, `users2`,`cars`,`anothercars`;

CREATE TABLE users (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eid` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `birthdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) CHARACTER SET = utf8
COLLATE = utf8_general_ci
ENGINE = InnoDB;

CREATE TABLE users2 (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eid` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `birthdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) CHARACTER SET = utf8
COLLATE = utf8_general_ci
ENGINE = InnoDB;

CREATE TABLE cars (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) CHARACTER SET = utf8
COLLATE = utf8_general_ci
ENGINE = InnoDB;

CREATE TABLE anothercars (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name2` varchar(255) DEFAULT NULL,
  `branding` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) CHARACTER SET = utf8
COLLATE = utf8_general_ci
ENGINE = InnoDB;
