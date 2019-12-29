# need to figure out why do we need this
sudo yum install epel-release
sudo yum update
sudo yum install redis
# It seems that service is not started after installation
sudo service redis start
# How to remove redis?
# sudo yum remove redis