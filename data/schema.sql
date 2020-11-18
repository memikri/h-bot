DROP DATABASE IF EXISTS HDB;
CREATE DATABASE HDB DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE HDB;

CREATE TABLE User
(
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    snowflake      CHAR(20)        NOT NULL,
    balance_bank   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    balance_wallet BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at     DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE KEY (snowflake)
) ENGINE = INNODB;

CREATE TABLE Guild
(
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    snowflake  CHAR(20)        NOT NULL,
    created_at DATETIME        NOT NULL DEFAULT NOW(),
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
    cost        BIGINT UNSIGNED NOT NULL,
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

CREATE TABLE EcoTransaction
(
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_loc  ENUM ('bank','wallet'),
    source_user BIGINT UNSIGNED,
    dest_loc    ENUM ('bank','wallet'),
    dest_user   BIGINT UNSIGNED,
    guild_id    BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (source_user) REFERENCES User (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (dest_user) REFERENCES User (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (guild_id) REFERENCES Guild (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CHECK ( (source_loc IS NOT NULL AND source_user IS NOT NULL) OR (dest_loc IS NOT NULL AND dest_user IS NOT NULL) )
) ENGINE = INNODB;
