wget https://archive.apache.org/dist/zookeeper/zookeeper-3.4.11/zookeeper-3.4.11.tar.gz -P /usr/local/src/
cd /usr/local/src && tar zxvf zookeeper-3.4.11.tar.gz -C /opt
cd /opt && mv zookeeper-3.4.11 zookeeper
cd zookeeper
cp conf/zoo_sample.cfg conf/zoo.cfg
echo -e "# append zk_env\nexport PATH=$PATH:/opt/zookeeper/bin" >> /etc/profile
egrep -v "^#|^$" /opt/zookeeper/conf/zoo.cfg
mkdir -p /opt/zookeeper/{logs,data}
# depends on specific machine
#echo "1" > /opt/zookeeper/data/myid