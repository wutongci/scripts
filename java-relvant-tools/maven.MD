* Install Maven In Mac
    * Download maven from http://maven.apache.org/download.cgi
    * sudo cp -R apache-maven-3.6.3 /usr/local/maven/ 
    * vim ~/.zshrc
        *  export M3_HOME=/usr/local/maven/maven-apache-3.6.3
        *  export PATH=$M3_HOME/bin:$PATH
    * source ~/.zshrc
* where is mvn config?
    * /usr/local/maven/maven-apache-3.6.3/config/settings.xml
* How to Config Maven?
    * You will see config/settings.xml directory in Maven Home
    * Refer to settings-newhouse.xml
* why does the jar library is downloaded from central repo in intellij?
    * The reason is that you should config the setting file mannualy
    * screenshot can be seen ![avatar](./images/maven-settings.jpg)
* maven的定位是什么?
    * 版本管理
        * 版本有冲突怎么办?
    * 打包编译
* maven是如何管理权限的?
* maven是如何管理版本的?
