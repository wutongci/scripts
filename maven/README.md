* 如何搭建maven服务器？
	* http://www.yund.tech/zdetail.html?type=1&id=4845e7e60a03d871e6960a99a7abbc84
* 如何检测客户端maven是否正常work?
	* mvn -v
* maven的配置文件在哪里？
	* vim /usr/local/apache-maven-3.6.3/conf/settings.xml
* 如何push jar包到maven服务器？
* 如何pull jar包到maven服务器？
* maven打包有哪几种策略？
	* maven-assembly-plugin
		* mvn clean
		* mvn package assembly:single  