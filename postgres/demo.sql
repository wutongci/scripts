drop database if exists experimental;
create database experimental;
use experimental;

create table user {
	id int unsigned primary key not nullauto_increment,
    name varchar(50) not null,
    age int unsigned not null

}