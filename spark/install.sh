wget https://www.apache.org/dyn/closer.lua/spark/spark-3.0.0-preview2/spark-3.0.0-preview2-bin-hadoop3.2.tgz -P  /usr/local/src
cd /usr/local/src && tar -xzf spark-3.0.0-preview2-bin-hadoop3.2.tgz -C /opt/
cd /opt && mv spark-3.0.0-preview2-bin-hadoop3.2 spark