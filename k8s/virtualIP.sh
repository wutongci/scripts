sudo vim /etc/network/interfaces
auto eth0:1
iface eth0:1 inet static
address 101.133.155.50
netmask 255.255.255.0
/etc/init.d/networking restart  # 没有就安装 apt install ifupdown 