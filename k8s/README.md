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
