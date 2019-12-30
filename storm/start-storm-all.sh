#!/bin/bash
#nimbus节点
nohup /opt/storm/bin/storm nimbus >/dev/null 2>&1 &
echo start nimbus [ done ]
sleep 1

nohup /opt/storm/bin/storm ui >/dev/null 2>&1 &
echo start ui [ done ]
sleep 1

nohup /opt/storm/bin/storm supervisor >/dev/null 2>&1 &
echo start supervisor...[ done ]
sleep 1
