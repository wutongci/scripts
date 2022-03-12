sudo ifconfig cni0 down
sudo ip link delete cni0
sudo ifconfig flannel.1 down
sudo ip link delete flannel.1
sudo rm -rf /var/lib/cni/
sudo rm -f /etc/cni/net.d/*
sudo /etc/init.d/networking restart
sudo service network restart