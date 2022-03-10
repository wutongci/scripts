sudo swapoff -a
free -m
sudo kubeadm reset				
sudo rm -rf /etc/kubernetes/
sudo rm -rf /var/lib/kubelet/
sudo rm -rf /var/lib/dockershim
sudo rm -rf /var/run/kubernetes
sudo rm -rf /var/lib/cni
sudo rm -rf /var/lib/etcd
sudo rm -rf /etc/cni/
sudo ifconfig cni0 down
sudo ifconfig flannel.1 down
sudo ifconfig docker0 down
sudo ip link delete cni0
sudo ip link delete flannel.1
sudo iptables -F 
sudo iptables -t nat -F 
sudo iptables -t mangle -F 
sudo iptables -X
sudo ipvsadm -C
sudo /etc/init.d/networking restart
sudo systemctl daemon-reload
sudo systemctl start docker
sudo systemctl start kubelet