* How to enable Ethernet cards?
  * run vi /etc/sysconfig/network-scripts/ifcfg-ens33
  * Update ONBOOT=no with ONBOOT=yes
  * restart network: sudo service network restart