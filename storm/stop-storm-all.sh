#!/bin/bash
#stop all nimbus and ui
kill -9 `ps -ef | grep nimbus | awk '{print $2}'| head -n 1`
kill -9 `ps -ef | grep core | awk '{print $2}'| head -n 1`

#stop all supervisor
kill -9 `ps -ef | grep supervisor | awk '{print $2}'| head -n 1`
