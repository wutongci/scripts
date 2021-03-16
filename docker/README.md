* 如何安装docker?
  * Ubuntu
    * https://www.myfreax.com/how-to-install-and-use-docker-on-ubuntu-18-04/
    * 整个安装过程步骤较多，参考上面的连接是有效的
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
