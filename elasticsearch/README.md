* Error
  * Exception in thread "main" java.nio.file.AccessDeniedException: /opt/elasticsearch/config/jvm.options
  ```
  chown yang /opt/elasticsearch/ -R
  ```
  * max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
    ```
    echo "vm.max_map_count=262144" > /etc/sysctl.conf
    sysctl -p
    ```
  *  exception caught on transport layer?
  * 常用命令
    * service elasticsearch status
  * 参考资源
    * https://www.itzgeek.com/how-tos/linux/ubuntu-how-tos/how-to-install-elasticsearch-logstash-and-kibana-elk-stack-on-ubuntu-18-04-ubuntu-16-04.html