# Debian 亲测成功
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list

sudo apt update
sudo apt install -y elasticsearch

sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch

curl -X GET http://localhost:9200

service elasticsearch status