#!/bin/bash
#nimbus节点
nimbusServers='10.128.42.59 10.128.42.78'

supervisorServers='10.128.42.59 10.128.42.78 10.128.42.118'

nohup /opt/storm/bin/storm nimbus >/dev/null 2>&1 &
echo start nimbus [ done ]
sleep 1

nohup /opt/storm/bin/storm ui >/dev/null 2>&1 &
echo start ui [ done ]
sleep 1

nohup /opt/storm/bin/storm supervisor >/dev/null 2>&1 &
echo start supervisor...[ done ]
sleep 1
