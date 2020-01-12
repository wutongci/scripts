* Prerequisite
  * hadoop
  * mysql
* Resource
  * https://blog.csdn.net/l1028386804/article/details/88014099
  * https://juejin.im/post/5c763f87f265da2d8c7dd9b4
* How to install hive?
  * run install.sh
  * update /etc/profile
    ```
    export HIVE_HOME=/opt/hive
    export PATH=$PATH:$HIVE_HOME/bin
    ```
    Run
    ```
    source /etc/profile
    ```
  * copy files
  * Fix error: hadoop Failed to instantiate SLF4J LoggerFactory
      ```
      rm -rf /opt/hive/lib/slf4j-log4j12-1.7.25.jar
      ```
  * Fix error: java.lang.NoSuchMethodError: com.google.common.base.Preconditions.checkArgument
      ```
      cp /opt/hadoop/share/hadoop/common/lib/guava-27.0-jre.jar lib/guava-27.0-jre.jar
      ```
  * copy mysql-connector-java-5.1.47.jar to /opt/hive/lib
  * ./bin/schematool -dbType mysql -initSchema
  * Summary
    * hive 2.3.6 has error happens
      * Exception in thread "main" java.lang.IllegalAccessError: class org.apache.hadoop.hive.ql.exec.FetchOperator tried to access method
    * hive 3.1.2 has error happens
      * [JDK 11- SessionState can't be initialized due to classloader problem](https://issues.apache.org/jira/browse/HIVE-21237)