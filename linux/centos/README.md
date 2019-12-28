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
  * reboot server
* How to change the mirrors?
  * Backup: mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
  * Backup: wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
* Fix error: "No package nginx available."
  * vim /etc/yum.repos.d/nginx.repo
    ```
      [nginx]
      name=nginx repo
      baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
      gpgcheck=0
      enabled=1
    ```
* How to upgrade to VIM 8.0+?
  * yum install gcc
  * yum install ncurses-devel.x86_64
  * sudo wget -O vim.zip https://github.com/vim/vim/archive/master.zip&&unzip vim.zip -d ./&&cd ./vim-master/src&&./configure --with-features=huge --enable-pythoninterp=yes --enable-cscope --enable-fontset --enable-python3interp=yes --with-python3-config-dir=/usr/local/python3/lib/python3.8/config-3.8-x86_64-linux-gnu  --prefix=/usr/local/vim  &&make&&make install
  * ln -s /usr/local/vim .local
  * Follow remaining steps in [VIM8 Upgrade in CentOS](https://blog.csdn.net/Kexiii/article/details/83928540)