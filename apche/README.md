* apache在mac上有哪些目录?
    * /etc/apache2
* 配置apache会牵涉到哪些文件?
    * /etc/apache2/httpd.conf
    * /etc/apache2/extra/httpd-vhosts.conf
    * /etc/apache2/extra/httpd-ssl.conf
    * 参考https://majing.io/posts/10000009381229
* 在apache上配置ssl的步骤? - 亲测有效
    * cd /etc/apache2  && sudo mkdir ssl
    * 拷贝 server.key, server.crt到ssl文件夹
    * 配置 sudo vim /etc/apache2/extra/httpd-ssl.conf
    * 配置 sudo vim /etc/apache2/extra/httpd-vhosts.conf
    * 配置 sudo vim /etc/apache2/httpd.conf
    * https://zhuanlan.zhihu.com/p/40635337
* 如何验证apache的配置没问题?
  * sudo apachectl configtest
* 如何在Mac上禁用apache?
* apache里的alias有什么含义?
* 如何查看apache版本?
    * apachectl -v
* 如何启动apache?
    * sudo apachectl start
* 如何关闭apache?
    * sudo apachectl stop
* 如何重启apache?
    * sudo apachectl -k restart