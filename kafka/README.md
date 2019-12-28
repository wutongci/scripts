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