
* 如何在安装nginx?
  * Mac
    * brew install nginx
  * Ubuntu
    * sudo apt update
    * sudo apt install nginx
  * CentOS
* 如何查看nginx状态?
  * Ubuntu, Centos
    * systemctl status nginx
* 如何查看nginx版本
  * nginx -v
* 如何启动nginx?
  * Ubuntu, Centos
    * sudo systemctl start nginx
* nginx 在mac上有哪些目录?
  * /usr/local/var/www -- 默认的主页存放的目录
  * /usr/local/var/log/nginx -- 日志文件
  * /usr/local/etc/nginx/ -- nginx配置文件存放的目录
  * /usr/local/Cellar/nginx/1.19.1 -- nginx的安装目录
* nginx在ubuntu上有哪些目录？
  * /etc/nginx/nginx.conf 
  * /etc/nginx/sites-enabled/
  * /etc/nginx/conf.d/
  * /usr/share/nginx/html/
* 如何生成证书? -- 亲测没有问题
  * openssl genrsa -out server.key 1024
  * openssl req -new -key server.key -out server.csr
    * 会提示你输入一些信息, Country Name输入ch即可,其余默认会车-见(images/server.csr.png)
  * cp server.key server.key.org
  * openssl rsa -in server.key.org -out server.key
  * openssl x509 -req -in server.csr -out server.crt -signkey server.key -days 3650
  * 最终会有四个文件,server.crt, server.csr, server.key,server.key.org
  * 把真正有效的两个文件server.crt和server.key拷贝到 /usr/local/etc/nginx/下
* 如何查看nginx版本?
  * nginx -v
* 测试nginx是否正常？
  * ubuntu
    * sudo nginx -t
* 如果启动nginx?
  * nginx
  * http://localhost:8080/, 查看是否work
* Nginx command
  * start nginx
  * nginx -s stop
  * nginx -s reload
  * nginx -t
* Generate server.key and server.crt
    * Don't use git bash, please use powershell or commandline
    * Ideally, you can specify relative path or absolute path for server.crt and server.key.
        * C://nginx//server.crt
        * server.crt
* config for https
  * it is better to check if port 443 is occupiedßßßß
  * In real case, i run into it and it is occupied by VMWare
* How to install specified version on MAC?
* How to uninstall specified version on MAC?
* How to generate certificate to support https?