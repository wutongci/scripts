* How to install spark?
  * prerequisite
    * Zookeeper
    * Hadoop
  * run install.sh
  * update env variable
    ```
    export SPARK_HOME=/opt/spark
    export PATH=${SPARK_HOME}/bin:$PATH
    ```
  * copy slaves, spark-env.sh to /opt/spark/conf
    * please kindly note jvm path in dirrerent linxu server
* How to run spart?
    ```
      cd /opt/spark && ./sbin/start-all.sh
    ```
* Note
  * Currently, I notice that spark will use 8080 and 8081. Also, storm will use 8080. So need to think about this issue later.