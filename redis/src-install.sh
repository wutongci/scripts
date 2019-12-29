wget http://download.redis.io/releases/redis-5.0.5.tar.gz -P /usr/local/src
cd /usr/local/src && tar zxvf redis-5.0.5.tar.gz -C /opt
cd /opt && mv redis-5.0.5 redis
cd redis && make distclean && make PREFIX=/opt/redis  install