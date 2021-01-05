* 美化curl的结果 - httpie
* 比对工具 - icdiff
* 文件搜索 - grep / ack -> ag -> ripgrep?
* 触摸板可以设置成触摸板轻敲替代按下的
* Bartender - 如果菜单栏过长, 可以将不太常用的菜单栏隐藏起来
* Alfred 插件 - 有用的workflow
* Dash 和 Alfred的组合
* 文件搜索 - HoudahSpot
* 文本输入增强 - aText或者TextExpander
* mackup - brew install mackup
    * 同步mac上面的的一些配置
* Iterm2 - Mac上最好的shell工具
* Iterm2插件
    * zsh-syntax-highlighting
    * zsh-autosuggestions
    * 值得去研究的配置 - git z vi-mode osx colored-man-pages catimg web-search vscode docker docker-compose copydir copyfile npm yarn extract fzf-z
* zsh 主题
    * https://www.cnblogs.com/askDing/p/6270269.html
    * https://github.com/ohmyzsh/ohmyzsh/wiki/External-themes
    * fino-time - 知道什么时候在什么地方, 其他类似的有jovial和ys
        * 定义完整的时间 %D{%Y-%m-%d} - 2020-12-08 - 15:34:48
        * 再加上 最近一次的commit信息 \$(git_prompt_short_sha)
    * strug - 相比于fino-time 没有时间
* brew国内镜像设置
    * export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles
* 命令和插件
    * brew install autojump - 任意目录切换工具, z.lua貌似更好，但配起来比较折腾，还需要详细的和autojump比较
    * z.lua - 目前看来比autojump好
    * brew install tree - 目录方式查看文件夹
    * brew install exa
    * brew install git-extras - 可以查看每个人对这个项目的贡献度
    * brew install httpie
    * brew install ranger - 浏览文件和目录下的工具，如何配合fzf?
    * brew install syncthing
    * brew install fd - 搜索文件夹和目录的工具
    * brew install tldr - 更直观的命令说明文档
    * brew install fpp
    * brew install multitail
    * brew install sl - 搞笑小火车
    * brew install ripgrep - 搜索一个文件夹下文本的内容
    * brew install tig - 命令行模式下，查看和比对commit历史
    * brew install htop - top的代替者
    * brew install glances - 更好的性能查看工具
    * brew install cat - bat的代替者
    * 日志工具 - tail vs inav, 有观点认为inav更强大
    * brew install fzf - 模糊搜索工具， 其他的有pick， selecta, ctrlp, fzy, 需要比较一下
    * 处理json - fx 和 jq.node
    * 开发自己的命令行工具初始化自定义项目 - https://github.com/tj/commander.js
* VsCode插件
    * Settings Sync - 可以将VS Code很多设置同步到别的环境
        * Sync: Update/Upload Settings
    * Partial Diff - 比对任意的代码片段
    * Code Runner - 调试多种语言的代码
    * Trailing Spaces - 高亮多余的空格
    * TODO TREE - 识别出代码中的 TODO： 关键字
    * vscode-icons - 可以让文件显示出对应的图标
    * Foam - 写文档专用，可以生成类似的概念关系图，是受Roam Research启发
        * 相应的笔记软件logseq-基于github
    * Better Comments - 对不同的信息进行颜色分类
    * Bracket Pair Colorizer - 括号匹配高亮
    * Better Align - 代码对齐
    * change-case - 改变变量名的形式，但怎么命名还是自己的事情
    * Prettier - 美化的代码的工具，但有争议，需要团队配合
    * kite - 代码补全工具
    * Jumpy - 可以跳到代码的任意地方
    * indent-rainbow - 高亮每行代码的缩进
    * Gitlens - 光标定位到某个代码行，可以看到是谁什么时候做了什么操作
    * Bookmark - 当在解决一个复杂问题，需要阅读在很多复杂文件的时候，需要做个标记，这样可以返回看相关的文件。
    * Code Spell Checker - 检查英文单词是否有错
    * Error Lens - 会对一些语法错误给出明显的提示
    * vscode-leetcode - 刷leetcode
    * VS Live Share - 协同开发
* VIM插件
* MAC 