* 如何用Swarm安装kafka?
  * 前提：三个带有公网的机器已经准备好，yang, yang-bj-1, yang-bj-2, 基于这三台机器的swarm集群也已经搭建好
  * 在每台机器上分别执行如下命令
    * mkdir -p {/data/kafka_cluster/zookeeper/data,/data/kafka_cluster/kafka/data,/data/kafka_cluster/kafka/logs}
    * chown -R 777 /data/kafka_cluster/
  * 安装zookeeper
    * docker stack deploy -c docker-stack-zookeeper.yml zoo --resolve-image=never --with-registry-auth
  * 安装kafka
    *  docker stack deploy -c docker-stack-kafka.yml kafka  --resolve-image=never --with-registry-auth
  * 安装kafka manager
    * docker stack deploy -c docker-stack-kafka-manager.yml kafka_manager  --resolve-image=never --with-registry-auth
* How to start kafka?
  ```
  cd /opt/kafka/bin
  ./kafka-server-start.sh  -daemon ../config/server.properties

  ```
* How to create a topic?
  * create a topic in local machine or in other machines--which means don't care about which machine run this command
  ```
  ./kafka-topics.sh --create --zookeeper 10.128.42.59:2181 --replication-factor 2 --partitions 1 --topic demotopic
  ```
* How to delete a topic?
  ```
  ./kafka-topics.sh --delete --zookeeper 10.128.42.59:2181 --topic demotopic
  ```
  * note
   * don't cares about which machine run this command
   * this delete just mean logical deletion, not mean physical deletion
* How to view a topic?
  ```
  ./kafka-topics.sh --list --zookeeper 10.128.42.59:2181
  ```
  * Note: we can also see the same result by running command above in other machiens: