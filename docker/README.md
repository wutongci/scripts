* 如何安装docker?
  * Ubuntu
    * https://www.myfreax.com/how-to-install-and-use-docker-on-ubuntu-18-04/
    * 整个安装过程步骤较多，参考上面的连接是有效的
   * Debian
    * https://www.myfreax.com/how-to-install-and-use-docker-on-debian-9/
    * 具体做的时候，需要参考ubuntu的步骤，手动指定版本
  * Centos - centos7.9 + docker 18.06.1
    * yum -y update
    * yum remove docker  docker-common docker-selinux docker-engine --如果之前安装过
    * yum install -y yum-utils device-mapper-persistent-data lvm2
    * 添加阿里镜像
      * yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    * 查看可用版本
      * yum list docker-ce --showduplicates | sort -r
    * 选择一个版本安装
      * yum -y install docker-ce-18.06.1.ce
    * 启动
      * systemctl start docker
    * 设置开机启动
      * systemctl enable docker
    * 参考资源
      * https://cloud.tencent.com/developer/article/1701451
    * 感想
      * 安装方式比Ubuntu简单
* 查看docker版本
  * docker version
* 如何构建一个image?
  * docker build -t ricky:0.0.1 .
  * docker tag ricky:0.0.1 101.132.172.54:5000/ricky:0.0.1
* 如何搭建docker仓库？
  * sudo docker pull registry:latest
  * sudo docker run -d -p 5000:5000 --name dev -v /tmp/registry:/tmp/registry registry:latest
    * 这个会在后台运行
* 如何推送一个image到仓库？
  * 修改配置让推送端可以不基于https
    * vim /etc/docker/daemon.json 
    * {"insecure-registries":["101.132.172.54:5000"]}
    * mac的具体配置可参考mac-push.png
  * sudo docker tag ricky:0.0.1 localhost:5000/ricky:0.0.1
  * sudo docker push localhost:5000/ricky:0.0.1 或者 sudo docker push 101.132.172.54:5000/ricky:0.0.1
* 踩坑记
  * 有时候发现无法下载或者上传Image，试试重新运行 sudo docker run -d -p 5000:5000 --name dev -v /tmp/registry:/tmp/registry registry:latest
