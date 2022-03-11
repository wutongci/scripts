sudo ifconfig flannel.1 down
sudo ip link delete flannel.1
sudo /etc/init.d/networking restart