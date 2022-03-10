kubeadm reset
sudo systemctl stop kubelet
sudo systemctl stop docker
sudo rm -rf /var/lib/cni/
sudo rm -rf /var/lib/kubelet
sudo rm -rf /etc/cni/
sudo ifconfig cni0 down
sudo ifconfig flannel.1 down
sudo ifconfig docker0 down
sudo ip link delete cni0
sudo ip link delete flannel.1
sudo systemctl start docker
sudo systemctl start kubelet