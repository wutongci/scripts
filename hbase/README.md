* How to install hbase?
  * run install.sh
  * update /etc/profile
  ```
  export HBASE_HOME=/opt/hbase
  export PATH=$PATH:$HBASE_HOME/bin
  ```
* How to start hbase?
  ```
    ./bin/start-hbase.sh
  ```
* How to verify hbase status?
  * http://10.128.42.59:16010/master-status
