wget https://mirror.bit.edu.cn/apache/hbase/2.2.2/hbase-2.2.2-bin.tar.gz -P  /usr/local/src
cd /usr/local/src && tar -xzf hbase-2.2.2-bin.tar.gz -C /opt/
cd /opt && mv hbase-2.2.2 hbase