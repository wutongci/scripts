* view Status
  ```
  sudo systemctl status redis
  ```
* Service Operation --not build by source code
  * sudo service redis start
  * sudo service redis stop
  * sudo service redis restart
* Service Operation -- build by source code
  * ./redis-server ../redis.conf
* How do a simple test?
  ```
  redis-cli
  set name "ricky in linux"
  get name
  ```
* How to build redis cluster?
  * create directory
  ```
  mkdir /opt/redis/redis-cluster
  cd /opt/redis/redis-cluster && mkdir 7000 7001 7002
  ```
  * copy redis.config to directory 7000, directory 7001, directory 7002
  * update config based on 7000, 7001, 7002
  * start redis instance
  ```
  for((i=0;i<=2;i++)); do /opt/redis/bin/redis-server /opt/redis/redis-cluster/700$i/redis.config; done
  ```
  * create cluster
    ```
    cd /opt/redis/bin
  ./redis-cli --cluster create 10.128.42.59:7000 10.128.42.59:7001 10.128.42.59:7002 10.128.42.78:7003 10.128.42.78:7004 10.128.42.78:7005 10.128.42.118:7006 10.128.42.118:7007 10.128.42.118:7008 --cluster-replicas 1
    ```
  * Verify cluster
    run cmd in one machine
    ```
    ./redis-cli -h 10.128.42.59 -c -p 7000
    ```
    run cmd in other machine
    ```
    ./redis-cli -h 10.128.42.118 -c -p 7007
    ```
  * useful commands 
    * cluster info
    * cluster nodes
  * view node infomation
    * ip:port is any available address
    ```
    ./redis-cli --cluster check 10.128.42.118:7006
    ```
* How to verify reids status?
  * ps -ef | grep redis
  * netstat -tnlp | grep redis 
* How to kill a redis instance?
  * kill -9 22292