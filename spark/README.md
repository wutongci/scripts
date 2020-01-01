* How to install spark?
  * prerequisite
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