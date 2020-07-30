
* 如何在mac上安装nginx?
  * brew install nginx
* nginx 在mac上有哪些目录?
  * /usr/local/var/www -- 默认的主页存放的目录
  * /usr/local/etc/nginx/ -- nginx配置文件存放的目录
  * /usr/local/Cellar/nginx/1.19.1 -- nginx的安装目录
* 如何查看nginx版本?
  * nginx -v
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