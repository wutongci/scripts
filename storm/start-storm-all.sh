#!/bin/bash
#nimbus节点
nimbusServers='10.128.42.59 10.128.42.78'

#supervisor节点
supervisorServers='10.128.42.59 10.128.42.78 10.128.42.118'

#启动所有的nimbus
nohup /opt/storm/bin/storm nimbus >/dev/null 2>&1 &
echo 从节点 $nim 启动nimbus...[ done ]
sleep 1
done

#启动所有的ui
nohup /opt/storm/bin/storm ui >/dev/null 2>&1 &
echo 从节点 $u 启动ui...[ done ]
sleep 1
done

#启动所有的supervisor
nohup /opt/storm/bin/storm supervisor >/dev/null 2>&1 &
echo 从节点 $visor 启动supervisor...[ done ]
sleep 1
done
