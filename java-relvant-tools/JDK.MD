* How to install jdk8 on Mac?
	* Go to https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html
    * 下载dmg文件,安装之后就可以了
* How to manage multi JDK version on Mac?
    * Install Jenv
        * brew install jenv
        * echo 'export PATH="$HOME/.jenv/bin:$PATH"' >> ~/.bash_profile
        * echo 'eval "$(jenv init -)"' >> ~/.bash_profile
        * jenv add /Library/Java/JavaVirtualMachines/jdk-14.jdk/Contents/Home
        * jenv add /Library/Java/JavaVirtualMachines/jdk1.8.0_212.jdk/Contents/Home
        * jenv local 1.8