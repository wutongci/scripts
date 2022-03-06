* 如何安装storm
  * docker-compose -f install.yml up -d
  * 开放8061端口
  * 验证 http://47.101.156.185:8061
* add env varaible
  ```
  vim /etc/profile
  export STORM_HOME=/opt/storm
  export PATH=$STORM_HOME/bin:$PATH
  ```
* add permission on shell file?
  ```
  chmod u+x xxxx.sh
  ```
* How to fix error: "Could not find leader nimbus from seed hosts Did you specify a valid list of nimbus hosts for config nimbus.seeds?"
  * The root cause is that we should config nimbus.seed with domain name
  * nimbus.seeds: ["ubuntu1", "centos1", "debian"]
  * config ipadress domain: vim /etc/hosts
  * note: nimbus.seeds is used to find leader
* 部署安装Storm
  * docker-compose -f install.yml up -d 亲测通过
  * 但也遇到了GET http://47.103.138.95:8061/api/v1/cluster/configuration 500 (Server Error) -> 将所有可疑的正在运行的container删除掉