* Install Maven In Mac
    * Download maven from http://maven.apache.org/download.cgi
    * sudo cp -R apache-maven-3.6.3 /usr/local/maven/ 
    * vim ~/.zshrc
        *  export M3_HOME=/usr/local/maven/maven-apache-3.6.3
        *  export PATH=$M3_HOME/bin:$PATH
    * source ~/.zshrc