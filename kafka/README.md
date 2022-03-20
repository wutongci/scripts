* 如何安装kafka? 2022.3.20验证通过
  * docker stack deploy --compose-file="install.yml" Kafka
  *  或者 docker-compose -f install.yaml up -d
  * 注意事项
    * 2181，9001这个端口要在主机上开启
    * install.yaml里面相应的IP要改成主机公网上的IP
* 如何用Swarm安装kafka? - 比较繁琐，暂时不建议使用
  * 前提：三个带有公网的机器已经准备好，yang, yang-bj-1, yang-bj-2, 基于这三台机器的swarm集群也已经搭建好
  * 在每台机器上分别执行如下命令
    * mkdir -p {/data/kafka_cluster/zookeeper/data,/data/kafka_cluster/kafka/data,/data/kafka_cluster/kafka/logs}
    * chown -R 777 /data/kafka_cluster/
  * 创建一个集群网络
    * docker network create --driver overlay swarm-net
  * 手动下载镜像
    * docker pull zookeeper:3.6.1
    * docker pull wurstmeister/kafka:2.12-2.5.0
    * docker pull kafkamanager/kafka-manager:3.0.0.4
  * 安装zookeeper
    * docker stack deploy -c docker-stack-zookeeper.yml zoo --resolve-image=never --with-registry-auth
  * 安装kafka
    *  docker stack deploy -c docker-stack-kafka.yml kafka  --resolve-image=never --with-registry-auth
  * 安装kafka manager
    * docker stack deploy -c docker-stack-kafka-manager.yml kafka_manager  --resolve-image=never --with-registry-auth
  * 如何检查zookeeper是否健康？
    * 进入容器内部 docker exec -it 0539b9784554 bash
    * ./bin/zkServer.sh status
    * 如果想查看详细报错， ./bin/zkServer.sh start-foreground
* 如何用docker-compose 安装kafka? - 2022.3.6 验证通过
  * docker-compose -f install.yml up -d
  * 在云服务器的控制台开启9001端口
  * 检查kafka manager是否work - http://sh5.ricky.pro:9001/
  * 如果有错误，可尝试开启2181端口
* 查看kafka的工具
  * https://www.kafkatool.com/download.html
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