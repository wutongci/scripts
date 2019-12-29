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