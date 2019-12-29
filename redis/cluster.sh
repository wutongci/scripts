# creat directory
mkdir /opt/redis/redis-cluster
cd /opt/redis/redis-cluster && mkdir 7000 7001 7002
# copy redis.config to directory 7000, directory 7001, directory 7002
# update config based on 7000, 7001, 7002
for((i=0;i<=2;i++)); do /opt/redis/bin/redis-server /opt/redis/redis-cluster/700$i/redis.config; done