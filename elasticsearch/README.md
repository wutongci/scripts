* Error
  * Exception in thread "main" java.nio.file.AccessDeniedException: /opt/elasticsearch/config/jvm.options
  ```
  chown yang /opt/elasticsearch/ -R
  ```
  * max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
    ```
    echo "vm.max_map_count=262144" > /etc/sysctl.conf
    sysctl -P
    ```