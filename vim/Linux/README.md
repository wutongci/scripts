* Configs
* How to install plugins?
  * git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim
  * run vim .vimrc, and then copy existing .vimrc config
  * exit it, and then run vim .vimrc again, input ":", input VundleInstall
  * copy color themes: cp .vim/bundle/vim-colors-solarized/colors/solarized.vim  .vim/colors/solarized.vim
* What's the most commonly used keyboard shortcuts?
* Most popular config in github
  * [spf13-vim](https://github.com/spf13/spf13-vim)
  * [dot-vimrc](https://github.com/humiaozuzu/dot-vimrc)
  * [ma-3.9k](https://github.com/ma6174/vim)
* Fix error in Debian: "insert VISUAL" model in vim,  consequence is that unable to paste content
  * set mouse-=a
* Fix error: "Taglist: Exuberant ctags (http://ctags.sf.net) not found in PATH. Plugin is not loaded"
  * For centos, run  run sudo yum install ctags
  * For ubuntu or debian, run sudo apt-get install ctags