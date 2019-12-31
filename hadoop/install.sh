wget http://mirror.bit.edu.cn/apache/hadoop/common/hadoop-3.2.1/hadoop-3.2.1.tar.gz -P /usr/local/src
cd /usr/local/src && tar -xzf hadoop-3.2.1.tar.gz -C /opt
cd /opt && mv hadoop-3.2.1 hadoop
# config host file, ie, vim /etc/hosts
# config env variable, vim /etc/profile
# copy xxx-site.xml file to /opt/hadoop/etc/hadoop
# grant other machines ssh permission
# start hadoop cluster ./sbin/start-all.sh