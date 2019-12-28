sudo wget https://www.python.org/ftp/python/3.8.0/Python-3.8.0.tgz&&tar zxvf Python-3.8.0.tgz&&mkdir /usr/local/python3&&cd Python-3.8.0&&./configure --prefix=/usr/local/python3 &&make && make install
ln -s /usr/local/python3/bin/python3 /usr/bin/python3
ln -s /usr/local/python3/bin/pip3 /usr/bin/pip3
## Update env
PATH=/usr/local/python3/bin:$PATH:$HOME/bin
export PATH
## make sure it takes effect
source ~/.bash_profile