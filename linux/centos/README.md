* How to enable Ethernet cards?
  * run vi /etc/sysconfig/network-scripts/ifcfg-ens33
  * Update ONBOOT=no with ONBOOT=yes
  * restart network: sudo service network restart
* How to create user?
  * Add user: useradd yang
  * Set password: passwd yang which only has read permission by default.
  * run vim /etc/passwd to modify info with "x:0:0", and then get the root permission.
* How to update hostname?
  * vi /etc/hostname
* How to view all users?
  * cat /etc/passwd
* How to delete one user?
  * userdel -r yang
  * you may run into error: user yang is currently used by process 10110, run "ps -u yang" to see which process is running, then run "sudo kill xxxx" to kill the process
* How to solve issue: "could not resolve host?"
  * vim /etc/resolv.conf
  * compare with normal server config