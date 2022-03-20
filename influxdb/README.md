* docker-compose -f install.yaml up -d
* 关闭influx服务
	*  docker-compose -f install.yaml down
* 占用内存过高
	* 限制内存的使用
	* 使用swarm的方式来部署
		* docker stack deploy --compose-file="install.yaml" influxApp
		* 删除 docker stack remove influxApp