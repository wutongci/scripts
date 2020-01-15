docker pull mirrorgooglecontainers/kube-apiserver:v1.17.0
docker pull mirrorgooglecontainers/kube-controller-manager:v1.17.0
docker pull mirrorgooglecontainers/kube-scheduler:v1.17.0
docker pull mirrorgooglecontainers/kube-proxy:v1.17.0
docker pull mirrorgooglecontainers/pause:3.1
docker pull mirrorgooglecontainers/etcd:3.4.3-0
docker pull coredns/coredns:1.6.5

docker tag docker.io/mirrorgooglecontainers/kube-apiserver:v1.17.0 k8s.gcr.io/kube-apiserver:v1.17.0
docker tag docker.io/mirrorgooglecontainers/kube-controller-manager:v1.17.0 k8s.gcr.io/kube-controller-manager:v1.17.0
docker tag docker.io/mirrorgooglecontainers/kube-scheduler:v1.17.0 k8s.gcr.io/kube-scheduler:v1.17.0
docker tag docker.io/mirrorgooglecontainers/kube-proxy:v1.17.0 k8s.gcr.io/kube-proxy:v1.17.0
docker tag docker.io/mirrorgooglecontainers/pause:3.1 k8s.gcr.io/pause:3.1
docker tag docker.io/mirrorgooglecontainers/etcd:3.4.3-0 k8s.gcr.io/etcd:3.4.3-0
docker tag docker.io/coredns/coredns:1.6.5 k8s.gcr.io/coredns:1.6.5

