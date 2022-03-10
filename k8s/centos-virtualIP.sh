sudo vim /etc/sysconfig/network-scripts/ifcfg-eth0:1

DEVICE=eth0:1
ONBOOT=yes
BOOTPROTO=static
IPADDR=47.101.156.185
NETMASK=255.255.255.0

service network restart