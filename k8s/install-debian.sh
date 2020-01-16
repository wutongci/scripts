apt-get update && apt-get install -y apt-transport-https
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add - 
echo  "deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main" >/etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-get install docker.io
sh ./docker.sh
apt-get install -y kubelet kubeadm kubectl
export KUBECONFIG=/etc/kubernetes/admin.conf