* 如何部署Skywalking - 2022.3.6验证通过
  * docker-compose -f install.yml up -d
  * 或者 docker stack deploy --compose-file="install.yaml" SkyWalkingApp
  * 开放18080
  * 创建一个topic curl -X PUT "sh5.ricky.pro:9200/demo"
  * 验证 skywalking http://sh5.ricky.pro:18080/
  * 验证 dejauv http://sh5.ricky.pro:1358/
* 资源
  * skywalking VS pinpoint
    * https://skywalking.apache.org/zh/2019-02-24-skywalking-pk-pinpoint/