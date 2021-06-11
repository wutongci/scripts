#json 原汁原味的保存
SELECT '{"bar": "baz", "balance":      7.77, "active":false}'::json;

#压缩之后保存
SELECT '{"bar": "baz", "balance":      7.77, "active":false}'::jsonb;

#创建JSON类型的表
CREATE TABLE JSONTest (data json);

insert into JSONTest values ('{"name": "ricky", "age":      35, "active":false}')

select * from JSONTest x where x.data::json->>'name' = 'ricky'


#创建JSONB类型的表
CREATE TABLE JSONBTest (data jsonb);

insert into JSONBTest values ('{"name": "ricky", "age":      35, "active":false}')

select * from JSONBTest x where x.data::json->>'name' = 'ricky'

# 分析一个SQL语句的执行过程
