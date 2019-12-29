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
* How to verify reids status?
  * ps -ef | grep redis
  * netstat -tnlp | grep redis 
* How to kill a redis instance?
  * kill -9 22292