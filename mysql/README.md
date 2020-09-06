* windows安装的Mysql如何可以被外网访问？
* Ubuntu 
  * 安装 Mysql?
    * sudo apt-get update
    * sudp apt-get install mysql-server
  * 检查mysql的状态
    * systemctl status mysql.service
    ![](./images/mysql-success.png)
  * 如何设置mysql的密码？
    * sudo mysql_secure_installation
  * 如何外网访问mysql?
    * 更新配置文件
      * sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
      * 注释掉 bind-address = 127.0.0.1
      * 在[mysqld]下面添加: port = 3306
      * 重启mysql: service mysql restart
      * 查看结果 3306的状态
        ![](./images/3306.png)
    * 更新用户表
      * use mysql;
      * update user set host='%' where user='root';
      * service mysql restart
* Debian 安装 Mysql?
* Centos 安装 Mysql?
