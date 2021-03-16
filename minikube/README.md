* 如何安装minikube
  * Ubuntu - 亲测有效
    * curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && chmod +x minikube && sudo mv minikube /usr/local/bin/
    * minikube version 
      * v1.18.1
* 如何安装kubectl?
  * Ubuntu
    * curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
    * chmod +x ./kubectl
    * sudo mv ./kubectl /usr/local/bin/kubectl
    * 查看版本
      * kubectl version
* 安装Virtualbox - 注意：安装了Docker之后，这一步不是必须
  * wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
  * wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
  * echo "deb [arch=amd64] http://download.virtualbox.org/virtualbox/debian $(lsb_release -cs) contrib" | \
     sudo tee -a /etc/apt/sources.list.d/virtualbox.list
  * sudo apt update
  * sudo apt install virtualbox-6.1
  * 参考资源
    * https://cloud.tencent.com/developer/article/1636687
* 启动minikube
  * minikube start
  * 报错
    * Exiting due to DRV_AS_ROOT: The "docker" driver should not be used with root privileges.
      * adduser dev
      * addusermod -aG sudo dev
      * su - dev
      * sudo groupadd docker
      * sudo usermod -aG docker $USER
      * 重启
      * 重新安装minikube
      * 参考方案-https://github.com/kubernetes/minikube/issues/7903
* 如何验证minikube是正常work的？
  * kubectl cluster-info
    * kubectl-cluster-info.png
  * minikube ssh
    * docker ps
    * minikube-ssh.png
* 如何远程访问dashboard?
  * minikube dashboard --url
    * 可以ctrl + c 取消
  * kubectl proxy --port=33458 --address='0.0.0.0' --accept-hosts='^.*' &
    * 以守护进程的方式运行
  * http://106.14.148.37:33458/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/