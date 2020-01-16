docker pull gotok8s/kube-apiserver:v1.17.0
docker pull gotok8s/kube-controller-manager:v1.17.0
docker pull gotok8s/kube-scheduler:v1.17.0
docker pull gotok8s/kube-proxy:v1.17.0
docker pull mirrorgooglecontainers/pause:3.1
docker pull opsbears/etcd:3.4.3
docker pull mirrorgooglecontainers/coredns:1.6.5


docker pull gotok8s/kube-apiserver:v1.17.1

docker tag docker.io/gotok8s/kube-apiserver:v1.17.0 k8s.gcr.io/kube-apiserver:v1.17.0
docker tag docker.io/gotok8s/kube-controller-manager:v1.17.0 k8s.gcr.io/kube-controller-manager:v1.17.0
docker tag docker.io/gotok8s/kube-scheduler:v1.17.0 k8s.gcr.io/kube-scheduler:v1.17.0
docker tag docker.io/gotok8s/kube-proxy:v1.17.0 k8s.gcr.io/kube-proxy:v1.17.0
docker tag docker.io/mirrorgooglecontainers/pause:3.1 k8s.gcr.io/pause:3.1
docker tag docker.io/opsbears/etcd:3.4.3 k8s.gcr.io/etcd:3.4.3-0
docker tag docker.io/mirrorgooglecontainers/coredns:1.6.5 k8s.gcr.io/coredns:1.6.5

