* add env varaible
  ```
  vim /etc/profile
  export STORM_HOME=/opt/storm
  export PATH=$STORM_HOME/bin:$PATH
  ```
* add permission on shell file?
  ```
  chmod u+x xxxx.sh
  ```
* How to fix error: "Could not find leader nimbus from seed hosts Did you specify a valid list of nimbus hosts for config nimbus.seeds?"
  * The root cause is that we should config nimbus.seed with domain name
  * nimbus.seeds: ["ubuntu1", "centos1", "debian"]
  * config ipadress domain: vim /etc/hosts
  * note: nimbus.seeds is used to find leader