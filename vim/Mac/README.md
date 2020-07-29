* How to init VIM in new MAC in quick way?
  * Prerequisite
    * iterm2
    * on-my-zsh
    	* sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    	* 可能遇到的权限问题
    	  * chmod 755 /usr/local/share/zsh
		  * chmod 755 /usr/local/share/zsh/site-functions
  * copy .vimrc to ~/.vimrc
  * git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim
  * run vim .vimrc again, input ":", input VundleInstall
  * copy color themes: cp .vim/bundle/vim-colors-solarized/colors/solarized.vim  .vim/colors/solarized.vim