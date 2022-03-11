* update /etc/apt/sources.list- may be not necessary?
  ```
  deb http://mirrors.aliyun.com/ubuntu/ xenial main restricted
  deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main restricted
  deb http://mirrors.aliyun.com/ubuntu/ xenial universe
  deb http://mirrors.aliyun.com/ubuntu/ xenial-updates universe
  deb http://mirrors.aliyun.com/ubuntu/ xenial multiverse
  deb http://mirrors.aliyun.com/ubuntu/ xenial-updates multiverse
  deb http://mirrors.aliyun.com/ubuntu/ xenial-backports main restricted universe multiverse
  deb https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial main
  ```
* update /etc/yum.repos.d/kubernetes.repo for centos
  ```
  [kubernetes]
  name=Kubernetes
  baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
  enabled=1
  gpgcheck=0
  repo_gpgcheck=0
  gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
  http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
  exclude=kube*
  ```
* run install.sh
* kubeadm init in master machine
  ```
  kubeadm init --apiserver-advertise-address=10.128.42.59 --pod-network-cidr=10.244.0.0/16
  ```
  Usually run this in slave machine
  ```
  kubeadm join 10.128.42.59:6443 --token r3gb5o.pjnz6jisu7voeozl     --discovery-token-ca-cert-hash sha256:1f364fc90cafe76222cf1d8072dfe7f98d59aa37f6c6df2ce23b6c91f6a1b02e
  ```
* Core Concept
  * Master
  * Node
  * Replication Controller
  * Pod
    * It consist of one or more containers
  * Service
  * Job
  * Volumn
  * Deployment
  * ConfigMap
  * Horizontal Pod Autoscaler
* Error
  * The connection to the server localhost:8080 was refused - did you specify the right host or port?
    Admin User
    ```
    export KUBECONFIG=/etc/kubernetes/admin.conf
    ```
    General User
    ```
    mkdir -p $HOME/.kube
    sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    sudo chown $(id -u):$(id -g) $HOME/.kube/config
    ```
  * Debian: Ign:1 cdrom://[Debian GNU/Linux 10.2.0 _Buster_ - Official amd64 DVD Binary-1 20191116-09:57] buster InRelease
    * comment out "deb cdrom:[Debian GNU/Linux 10.2.0 _Buster_ - Official amd64 DVD Binary-1 20191116-09:57]/ buster contrib main" in /etc/apt/sources.list
  * Debian: [ERROR Swap]: running with swap on is not supported. Please disable swap
    Disable it temporarily
    ```
    sudo swapoff -a
    ```

    Disable it permanently
    ```
    vim /etc/fstab
    ```
    comment out the line which contains swap
  * Error while initializing connection to Kubernetes apiserver. This most likely means that the cluster is misconfigured
    ```
    https://www.jianshu.com/p/f9a2bd82e368
    ```
  * Metric client health check failed: the server could not find the requested resource?
  * Useful commands
    * kubectl describe deployment kubernetes-dashboard -n kube-system
    * kubectl get pods --namespace=kube-system
    * kubectl get service --namespace=kube-system
    * kubectl describe pod kubernetes-dashboard-b8cb74bdd-xqr6w --namespace kube-system
    * kubectl logs kubernetes-dashboard-b7ffbc8cb-45z4h --namespace kube-system
  * Resources
    * [1](https://jimmysong.io/kubernetes-handbook/practice/dashboard-addon-installation.html)
    * [2](https://www.qikqiak.com/k8s-book/docs/17.%E5%AE%89%E8%A3%85%20Dashboard%20%E6%8F%92%E4%BB%B6.html)
    * [3](https://tomoyadeng.github.io/blog/2018/10/12/k8s-in-ubuntu18.04/index.html)
    * [4](https://jimmysong.io/kubernetes-handbook/practice/install-kubernetes-on-ubuntu-server-16.04-with-kubeadm.html)
* MAC
  * where is kubeconfig?
    * ~/.kube/config.yaml
* 如何搭建跨vpc的k8s集群？Ubuntu版本
  * 安装Docker
  * 在所有节点上安装  kubectl kubelet kubeadm
    * sudo apt-get update && apt-get install -y apt-transport-https
    * sudo curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add - 
    * cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF
    * sudo apt-get update
    * apt-get install -y kubectl kubelet kubeadm
    apt-get install -y kubeadm=1.20.4-00 kubectl=1.20.4-00 kubelet=1.20.4-00
  * 关闭swap
    * sudo swapoff -a
    * free -m
  * 清除网络设置 - 参见clearnetwork.sh
  * 开放各种端口
    * Master节点端口 6443 2379-2380 10250 10259 10257
    * work节点端口 30000-32767 10250 8472
  * 创建虚拟网卡
    * unbuntu - 参考 vitualIP.sh
    * 如果是centos - 参考 centos-virtualIP.sh
  * 配置所有公网的Host
  * 设置/etc/modules-load.d/k8s.conf - 参见module.config
  * 设置/etc/sysctl.d/k8s.conf - 参见sysctl.config
  * 设置/etc/docker/daemon.json - 参见damon.json
  * 添加公网ip到配置文件, /etc/systemd/system/kubelet.service.d/10-kubeadm.conf -- 参见kubeadm.config, 如果在centos下面看不到这个文件和文件夹，自己手动创建
  * 重启 
    * systemctl daemon-reload
    * systemctl restart docker
    * systemctl restart kubelet
  * 选择任意一台服务器作为master
    * kubeadm init --apiserver-advertise-address=101.133.155.50 --image-repository registry.aliyuncs.com/google_containers  --control-plane-endpoint=101.133.155.50 --service-cidr=10.96.0.0/12  --pod-network-cidr=10.244.0.0/16
      * 注意：在阿里云中会报错，具体解决办法如下 https://my.oschina.net/u/4389078/blog/3233116 - 亲测有效
      * 后来再次安装的时候，上述问题不见了
      * pod-network-cidr=10.244.0.0这个配置参数十分重要，要和下面的flannel文件里面的设置要配起来
    * 配置config - 注意：这个是文件是来自于master机器，但是非master机器也要配置
      * mkdir -p $HOME/.kube
      * sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
        * 注意这个地方会提示你是否需要覆盖，输入y
      * sudo chown $(id -u):$(id -g) $HOME/.kube/config
  * 在/etc/kubernetes/manifests/kube-apiserver.yaml 修改 --bind-address=0.0.0.0和修改--advertise-addres=101.133.155.50
    * 这个操作仅仅会在master上执行
  * 安装网络插件flannel - 仅仅需要在master节点上执行
    * kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml - 不需要了
    * kubectl apply -f fannel.yml -- 使用这个
  * 以上跨集群的操作基本上基于如下的三个连接
    * https://blog.csdn.net/weixin_43988498/article/details/122639595
    * https://www.caiyifan.cn/p/d6990d10.html
    * https://www.cnblogs.com/wangxu01/articles/11803547.html#top
  * 验证相关信息
    * kubectl get pod -n kube-system
    * kubectl get nodes
  * worker节点加入这台master
    * 查看如何加入master?
      * kubeadm token create --print-join-command
    * kubeadm join 106.14.148.37:6443 --token he430e.0pvbwq1qvdm2hgmc \
    --discovery-token-ca-cert-hash sha256:f8c21514c6c3e2e2cce5557d40cb81f485e2245a443c3df5a8702320e05ecc33 --ignore-preflight-errors=all
  * 如何重新加入master?
    * 先要运行 kubeadm reset
  * 漂亮的实践
    * 如果一台或者多台机器因为某种原因需要重启怎么办？
      * work节点：
        * 删除kube-proxy这个pod, 然后会自动更新这个pod。 如果这个行不同，转到下面
        * 更新flannel网络 - 本质上是重建flannel网络
          * sudo ifconfig flannel.1 down
          * sudo ip link delete flannel.1
          * sudo /etc/init.d/networking restart
          * 找到这台机器对应的kube-flannel-XX的pod,删除之，会自动更新
          * 大概率就好了
        * 如果上述方案实在不行, 重新加入master节点
      * Master节点-(这可是终极大杀器，即使很多work节点和master节点同时重启也能成功,实测通过):
        * /etc/init.d/networking restart -- 无脑先执行
        * kubectl get node -- 看看能不能拿到结果
        * kubectl delete -f flannel.yml
        * kubectl apply -f flannel.yml
        * 等待相关pod变绿, 然后ping一下其他主机的pod
  * 如何安装k8s Dashboard?
    * 下载自己的k8s项目，运行其中的 recommend.yaml
      * kubectl apply -f recommended.yaml
      * 这里面已经自定义了port和指定了运行在某一台机器上
    * 验证dashboard是否运行正常？
      * kubectl get pods --namespace=kubernetes-dashboard -o wide
    * 生成证书
      * openssl genrsa -out dashboard.key 2048
      * openssl req -new -out dashboard.csr -key dashboard.key -subj '/CN=ip地址'
      * openssl x509 -req -in dashboard.csr -signkey dashboard.key -out dashboard.crt
      * kubectl delete secret kubernetes-dashboard-certs -n kubernetes-dashboard
      * kubectl create secret generic kubernetes-dashboard-certs --from-file=dashboard.key --from-file=dashboard.crt -n kubernetes-dashboard
      * kubectl get pod -n kubernetes-dashboard
      * kubectl delete pod XXXXX  -n kubernetes-dashboard
    * 新建用户
      * kubectl create -f dash-admin.yaml
    * 获取token
      * kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')
    * 配置niginx
      * 具体参见ssl
    * https://zhuanlan.zhihu.com/p/91731765
      * 这个操作已经验证通过
      * 注意事项
        * 用的是自己定义的recommend.yaml文件，这样可以让pod在指定的node上运行
        * 免费产生的nginx证书无效
    *  https://cloud.tencent.com/developer/article/1638856
      * 通过https://freessl.cn，在线生成免费1年的ssl证书。这是借鉴的重点
      * 这里会用到一个工具叫KeyManager,使用细节可参考印象笔记
      * 或者尝试这个 https://ohttps.com/monitor/dashboard
  * 资源
    * https://www.cnblogs.com/alamisu/p/10751418.html
* 如何搭建k8s集群？Centos版本-版本7.9, k8s版本1.20.4, docker版本:18.06.1-ce
  * 关闭防火墙
    * systemctl disable firewalld
    * systemctl stop firewalld
  * setenforce 0
  * sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/sysconfig/selinux
  * sed -i "s/SELINUX=enforcing/SELINUX=disabled/g" /etc/selinux/config
  * swapoff -a
  * sed -i 's/.*swap.*/#&/' /etc/fstab
  * cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
  * sysctl --system
  * 配置镜像
    cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
  * yum install -y kubectl kubeadm kubelet
  * 创建配置文件
    * systemctl enable kubelet && systemctl start kubelet
  * 如何加入Master?
    * 步骤和Ubuntu一致
  * 验证是否加入master?
    * kubectl get node
    * 结果发现状态是NotReady, 这是一个坑，解决办法是
      * vim /var/lib/kubelet/kubeadm-flags.env, 移除 --network-plugin=cni
      * systemctl restart kubelet
      * 备注：Flannel安装的时候pod遇到一个问题： [ContainersNotInitialized] containers with incomplete status: [install-cni]，也是类似的解决办法
  * 资源
    * https://segmentfault.com/a/1190000037682150  - 主要参考这个资源
    * https://zhuanlan.zhihu.com/p/96084545 - 这个里面修改systemd把握带沟里去了
* 如何搭建k8s集群-Debian
  * 基本步骤和ubuntu一致
  * 加入master之后状态也是NotReady, 解决办法也是
    * vim /var/lib/kubelet/kubeadm-flags.env, 移除 --network-plugin=cni
    * systemctl restart kubelet
* 如何部署一个应用到k8s集群？
  * 创建一个命名空间
    * kubectl create -f https://k8s.io/examples/admin/namespace-dev.json
* 如何将pod分配给固定的Node?
  * NodeSelector
* 如何搭建一个简单的Ingress?
  * docker run -p 1080:80 -p 1443:443 -p 20201:30201  --name rancher --privileged --restart=unless-stopped -d rancher/rancher:v2.5-head
  * 
* 如何部署rancher?
  * kubectl apply -f rancher.yaml
* 如何进入pod内部？
  * kubectl exec -it nginx-56b8c64cb4-t97vb -- /bin/bash
* 查看pod内部的进程
  * ps -ef
* Node标签
  * 如何查看Node 标签？
    * kubectl get nodes --show-labels
  * 如何打标签？
    * kubectl label nodes yang-bj-1 group=bj
* K8s踩坑记
  * Failed create pod sandbox: open /run/systemd/resolve/resolv.conf: no such file or directory
    * 这个原因是因为创建的pod是在debian上，缺少了文件/run/systemd/resolve/resolv.conf，在正常的机器上找到这个文件然后拷贝过去 或者看看 是不是存在 /etc/resolv.conf. 耗时大概半个小时
  * 如何彻底的删除一个命名空间？
    * kubectl patch namespace cattle-system -p '{"metadata":{"finalizers":[]}}' --type='merge' -n cattle-system
      kubectl delete namespace cattle-system --grace-period=0 --force
      kubectl patch namespace fleet-system -p '{"metadata":{"finalizers":[]}}' --type='merge' -n fleet-system

      kubectl delete namespace fleet-system --grace-period=0 --force
  * K8s集群中Controller Manager，Scheduler发生不健康的状态怎么办？
    * ls /etc/kubernetes/manifests/， 找到kube-controller-manager.yaml kube-scheduler.yaml文件，将--port=0 注释掉
  * kube-controller-manager 中的 报错：kubelet  Liveness probe failed: Get "https://127.0.0.1:10257/healthz": dial tcp 127.0.0.1:10257: connect: connection refused
    * sed -i '/- --port=0/d' /etc/kubernetes/manifests/kube-controller-manager.yaml
    * 重启k8s: systemctl restart kubelet
  * 北京的主机和上海主机不能ping通
    * 目前没有好的解决方案，也耗尽了我不少精力，让我头脑清晰一下吧
    * 可行的方案
      * 上海的机器尝试好几个机器（北京1，北京2）？？？
      * 以后部署尽量部署在北京1，北京2上，因为北京1和北京2在一个局域网上
  * 删除PV和PVC
    * kubectl patch pv opspv -p '{"metadata":{"finalizers":null}}'
    * kubectl delete pv opspvc