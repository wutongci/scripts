wget http://mirrors.tuna.tsinghua.edu.cn/apache/kafka/2.2.0/kafka_2.11-2.2.0.tgz -P /usr/local/src
cd /usr/local/src && tar -xzf kafka_2.11-2.2.0.tgz -C /opt/
cd /opt && mv kafka_2.11-2.2.0 kafka && mkdir kafka/log
# update server.properties
cd /opt/kafka/bin/
# start kafka
# ./kafka-server-start.sh -daemon ../config/server.properties

# send message
./kafka-console-producer.sh --broker-list 10.128.42.59:9092 --topic demo1
# receive message
./kafka-console-consumer.sh --bootstrap-server 10.128.42.118:9092 --from-beginning --topic demo1
# receive message
./kafka-console-consumer.sh --bootstrap-server 10.128.42.78:9092 --from-beginning --topic demo1