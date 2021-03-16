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
  * mongo --port 27017
    * use admin;
    * db.createUser({user: "root", pwd: "11111111", roles: [{role: "userAdminAnyDatabase", db: "admin"}]});
  * 再次修改 sudo vim /etc/mongodb.conf
    * auth=true
  * systemctl restart mongodb.service
  * 最后连接成功的状态: success.png