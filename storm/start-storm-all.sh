#!/bin/bash
#nimbus节点
nimbusServers='10.128.42.59 10.128.42.78'

#supervisor节点
supervisorServers='10.128.42.59 10.128.42.78 10.128.42.118'

#启动所有的nimbus
for nim in $nimbusServers
do
    ssh -T $nim <<EOF
        nohup /opt/storm/bin/storm nimbus >/dev/null 2>&1 &
EOF
echo 从节点 $nim 启动nimbus...[ done ]
sleep 1
done

#启动所有的ui
for u in $nimbusServers
do
    ssh -T $u <<EOF
        nohup /opt/storm/bin/storm ui >/dev/null 2>&1 &
EOF
echo 从节点 $u 启动ui...[ done ]
sleep 1
done

#启动所有的supervisor
for visor in $supervisorServers
do
    ssh -T $visor <<EOF
        nohup /opt/storm/bin/storm supervisor >/dev/null 2>&1 &
EOF
echo 从节点 $visor 启动supervisor...[ done ]
sleep 1
done
