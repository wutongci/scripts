*  Unable to start zookeeper in centos?
  * 1rd way-Stop Firewall: systemctl stop firewalld.service
  * 2nd way-Disable Firewall: systemctl disable firewalld.service
* How to restart zookeeper?
  ```
  /opt/zookeeper/bin/zkServer.sh restart
  ```
* Usually, there should have at least 2 machines in cluster
* Zookeeper客户端？
  * prettyZoo-mac.dmg, https://github.com/vran-dev/PrettyZoo/releases
