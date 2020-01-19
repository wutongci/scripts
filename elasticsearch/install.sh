wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.4.2.tar.gz -P /usr/local/src
cd /usr/local/src && tar -xzf elasticsearch-6.4.2.tar.gz -C /opt/
cd /opt/ && mv elasticsearch-6.4.2 elasticsearch