# 集合等于数据库里的表，且shcema-free, 文档->行， Column->Field

# 切换数据库
use demo;

# 向Collection 插入数据，user是一个Collection
db.user.insert({
 "name": "chenyurong",
"age": 25
 })
 