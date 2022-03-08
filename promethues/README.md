* 如何安装 - 2022.3.6验证
	* sudo mkdir -p /etc/prometheus & sudo mkdir -p /etc/prometheus/jobs & sudo cp -rf prometheus.yml /etc/prometheus/prometheus.yml &sudo cp -rf alertmanager.yml /etc/prometheus/alertmanager.yml &sudo cp -rf node_down.yml /etc/prometheus/node_down.yml && sudo cp -R jobs /etc/prometheus/jobs
	* docker-compose -f install.yml up -d
	* 开放3000
	* 9090端口是否一定要开放?
* 安装promethues
	* docker pull prom/node-exporter
	* docker pull prom/prometheus
	* docker pull grafana/grafana
	* 编辑prometheus.yaml
		* mkdir /opt/prometheus && cd /opt/prometheus/
		* cd /opt/prometheus/
		* vim prometheus.yml 将其中的host改为公网IP
	* 启动Node Exporter
		* docker run -d -p 9100:9100 \
  -v "/proc:/host/proc:ro" \
  -v "/sys:/host/sys:ro" \
  -v "/:/rootfs:ro" \
  --net="host" \
  prom/node-exporter
  	* 启动Promethus
		* docker run  -d \
	  -p 9090:9090 \
	  -v /opt/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml  \
	  prom/prometheus
	 * 启动Grafana
 	* mkdir /opt/grafana-storage &&  chmod 777 -R /opt/grafana-storage
 	*  docker run -d \
  -p 3000:3000 \
  --name=grafana \
  -v /opt/grafana-storage:/var/lib/grafana \
  grafana/grafana

* 参考资源
	* https://www.cnblogs.com/xiao987334176/p/9930517.html