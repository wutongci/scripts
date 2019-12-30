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