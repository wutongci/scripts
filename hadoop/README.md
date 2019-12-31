* Ideally, we only need to run script in one machine
* how to grant permssion on other machines?
  ```
  ssh-keygen -t rsa
  ssh-copy-id ubuntu1
  ssh-copy-id centos1
  ssh-copy-id debian
  ```
  * Note: need to enbale root login in every linxu server
* How to Start hadoop cluster?
  ```
  ./sbin/start-all.sh
  ```
* How to strop hadoop cluster?
  ```
  ./sbin/stop-all.sh
  ```
* How to check Hadoop status?
  * http://10.128.42.59:9870/dfshealth.html#tab-overview  (master server)
  * http://10.128.42.59:8088/cluster
* Fix error: "Error occurred during initialization of boot layer java.lang.module.FindException: Module java.activation not found"
  * Download activiation-1.1.jar
  * add the following config in yarn-env.sh file
  ```
  export YARN_RESOURCEMANAGER_OPTS="--add-modules=ALL-SYSTEM"
  export YARN_NODEMANAGER_OPTS="--add-modules=ALL-SYSTEM"
  ```