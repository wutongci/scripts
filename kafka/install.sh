wget http://mirrors.tuna.tsinghua.edu.cn/apache/kafka/2.2.0/kafka_2.11-2.2.0.tgz -P /usr/local/src
cd /usr/local/src && tar -xzf kafka_2.11-2.2.0.tgz -C /opt/
cd /opt && mv kafka_2.11-2.2.0 kafka && mkdir kafka/log
# update server.properties
cd /opt/kafka/bin/
# ./kafka-server-start.sh -daemon ../config/server.properties