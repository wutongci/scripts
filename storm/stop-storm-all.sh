#!/bin/bash

#nimbus节点
nimbusServers='10.128.42.59 10.128.42.78'

#supervisor节点
supervisorServers='10.128.42.59 10.128.42.78 10.128.42.118'

#停止所有的nimbus和ui
for nim in $nimbusServers
do
    echo 从节点 $nim 停止nimbus和ui...[ done ]
    ssh $nim "kill -9 `ssh $nim ps -ef | grep nimbus | awk '{print $2}'| head -n 1`" >/dev/null 2>&1
    ssh $nim "kill -9 `ssh $nim ps -ef | grep core | awk '{print $2}'| head -n 1`" >/dev/null 2>&1
done

#停止所有的supervisor
for visor in $supervisorServers
do
    echo 从节点 $visor 停止supervisor...[ done ]
    ssh $visor "kill -9 `ssh $visor ps -ef | grep supervisor | awk '{print $2}'| head -n 1`" >/dev/null 2>&1
done
