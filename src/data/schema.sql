DROP DATABASE IF EXISTS HDB;
CREATE DATABASE HDB DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE HDB;

CREATE TABLE User
(
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    snowflake      CHAR(20)        NOT NULL,
    balance_bank   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    balance_wallet BIGINT UNSIGNED NOT NULL DEFAULT 0,
    premium_exp    DATETIME                 DEFAULT NULL,
    created_at     DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE KEY (snowflake)
) ENGINE = INNODB;

CREATE TABLE Guild
(
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    snowflake   CHAR(20)        NOT NULL,
    premium_exp DATETIME                 DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE KEY (snowflake)
) ENGINE = INNODB;

CREATE TABLE GuildMember
(
    guild_id   BIGINT UNSIGNED NOT NULL,
    user_id    BIGINT UNSIGNED NOT NULL,
    created_at DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (guild_id, user_id),
    FOREIGN KEY (guild_id) REFERENCES Guild (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = INNODB;

CREATE TABLE Item
(
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    label       VARCHAR(32)     NOT NULL,
    name        VARCHAR(255)    NOT NULL,
    cost        BIGINT UNSIGNED          DEFAULT NULL,
    description VARCHAR(255)    NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE KEY (label),
    UNIQUE INDEX (name),
    INDEX (cost)
) ENGINE = INNODB;

CREATE TABLE UserItem
(
    user_id    BIGINT UNSIGNED NOT NULL,
    item_id    BIGINT UNSIGNED NOT NULL,
    quantity   INT UNSIGNED    NOT NULL,
    created_at DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES User (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Item (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = INNODB;

CREATE TABLE PremiumKey
(
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED NOT NULL,
    code_hash   CHAR(64)        NOT NULL,
    redeemed_at DATETIME                 DEFAULT NULL,
    expires_at  DATETIME                 DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES User (id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE INDEX (code_hash)
) ENGINE = INNODB;

INSERT INTO Item
SET label       = 'premium_oneday',
    name        = 'Premium Code (1 Day)',
    description = 'This item allows you to redeem one day of h Bot premium.';
