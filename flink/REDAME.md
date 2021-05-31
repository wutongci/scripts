* How to install flink?
  * run install.sh
  * update /opt/flink/conf/slaves
    ```
    centos1
    debian
    ```
  * update /opt/flink/conf/master
    ```
    ubuntu1:8021
    ```
* How to run flink cluster?
  ```
  ./bin/start-cluster.sh
  ```
* 安装部署
  * docker-compose -f install.yml up -d 亲测有效，开放的是8091端口
  * 未见CPU有明显变化，内存大约上升了7%左右