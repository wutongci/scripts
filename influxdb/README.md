* 如何安装influxdb?
	* docker-compose -f install.yaml up -d
	* docker-compose -f install.yaml down
* 如何安装influxdb - swarm 方式?
	* docker stack deploy --compose-file="install.yaml" influxApp
	* 删除 docker stack remove influxApp
* 如何创建一个database?
	* 找到运行的container - docker ps
	* 登docker内部
		* docker exec -it 8a5d15a1c17d bash
	* 执行 influx -precision rfc3339
	* 执行 CREATE DATABASE prometheus
* 问题
	* 占用内存过高
		* 使用swarm的方式限制内存的使用