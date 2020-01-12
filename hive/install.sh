wget https://mirrors.tuna.tsinghua.edu.cn/apache/hive/hive-2.3.6/apache-hive-2.3.6-bin.tar.gz -P /usr/local/src
cd /usr/local/src && tar -xzf apache-hive-2.3.6-bin.tar.gz -C /opt/
cd /opt && mv apache-hive-2.3.6-bin hive
wget http://ftp.ntu.edu.tw/MySQL/Downloads/Connector-J/mysql-connector-java-5.1.47.tar.gz -P /usr/local/src
cd /usr/local/src && tar -xzf mysql-connector-java-5.1.47 -C /opt/