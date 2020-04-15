* How to manage multi JDK version on Mac?
    * Install Jenv
        * brew install jenv
        * echo 'export PATH="$HOME/.jenv/bin:$PATH"' >> ~/.bash_profile
        * echo 'eval "$(jenv init -)"' >> ~/.bash_profile
        * jenv add /Library/Java/JavaVirtualMachines/jdk-14.jdk/Contents/Home
        * jenv add /Library/Java/JavaVirtualMachines/jdk1.8.0_212.jdk/Contents/Home
        * jenv local 1.8