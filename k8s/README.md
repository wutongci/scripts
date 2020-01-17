* update /etc/apt/sources.list
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
* run install.sh
* kubeadm init
  ```
  kubeadm init --apiserver-advertise-address=10.128.42.59 --pod-network-cidr=10.244.0.0/16
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
    ```
    export KUBECONFIG=/etc/kubernetes/admin.conf
    ```
