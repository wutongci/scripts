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
sudo systemctl start docker
sudo systemctl start kubelet
/etc/init.d/networking restart