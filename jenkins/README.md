* 如何安装jenkins?
  * 先要安装jdk
  * wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
  * echo "deb https://pkg.jenkins.io/debian-stable binary/" >> /etc/apt/sources.list
  * sudo apt-get update
  * sudo apt-get install jenkins 
* 如何启动Jenkins?
  * service jenkins start
* 如何查看kenkins 状态？
  * service status jenkins
* 如何修改kenkins端口
  * sudo vim /etc/default/jenkins
* 如何查看jenkins的token?
  * sudo vim /var/jenkins_home/secrets/initialAdminPassword