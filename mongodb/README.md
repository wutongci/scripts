* 如何安装MongoDB?
  * Ubuntu
    * sudo apt install mongodb
* 如何查看MongoDB的状态？
  * ubuntu
    * sudo systemctl status mongodb
* 如何查看MongonDB的版本？
  * mongo --version
* 如何让MongoDB可以被外网访问？-在v3.6.3亲测有效
  *  修改 sudo vim /etc/mongodb.conf
    * bind_ip = 0.0.0.0
  * systemctl restart mongodb.service
    * use admin;
    * db.createUser({user: "root", pwd: "11111111", roles: [{role: "userAdminAnyDatabase", db: "admin"}]});
    * db.grantRolesToUser('root', [{ role: 'root', db: 'admin' }])
  * 再次修改 sudo vim /etc/mongodb.conf
    * auth=true
  * systemctl restart mongodb.service
  * 最后连接成功的状态: success.png
* 如果修改账号的密码？
  * use admin;
  * db.auth("admin","admin");
  * db.changeUserPassword('root','yang$1111');
* 创建一个数据库
  * use demo
  * db.demo.insert({"name":"rickymongodb"})
  * 查询数据
    * db.demo.find().pretty()
* 踩坑记
  * not authorized on admin to execute command
   * mongo --port 27017 -u root -p 11111111  --authenticationDatabase admin
   * use admin;
   * db.auth("admin","admin");
   * 执行
    * db.grantRolesToUser("admin", [ { role:"dbOwner", db:"admin"} ]) ;
    * db.grantRolesToUser("admin", [ { role:"readWrite", db:"admin"} ]) ;
    * 如果其他用户也有类似的情况，执行类似的操作