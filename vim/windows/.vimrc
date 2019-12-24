:set nocompatible
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
syntax enable
set background=dark
set nu
colorscheme solarized
autocmd vimenter * if !argc()|NERDTree|endif
let g:NERDTreeDirArrowExpandable = '▸'
let g:NERDTreeDirArrowCollapsible = '▾'
let g:NERDTreeWinSize = 16
let NERDTreeMinimalUI = 1
let NERDTreeDirArrows = 1
let g:nerdtree_tabs_open_on_console_startup=1
call vundle#begin()
Plugin 'VundleVim/Vundle.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'altercation/vim-colors-solarized'
Plugin 'jistr/vim-nerdtree-tabs'
call vundle#end()
filetype plugin indent on
