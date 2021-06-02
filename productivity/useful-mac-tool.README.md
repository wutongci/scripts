* 美化curl的结果 - httpie
* 比对工具 - icdiff
* 文件搜索 - grep / ack -> ag -> ripgrep?
* 触摸板可以设置成触摸板轻敲替代按下的
* Bartender - 如果菜单栏过长, 可以将不太常用的菜单栏隐藏起来
* Alfred 插件 - 有用的workflow
    * 最近修改的文件 - https://github.com/hzlzh/AlfredWorkflow.com/blob/master/Downloads/Workflows/Last-changed-files.alfredworkflow
    * 管理chrome标签 - http://www.packal.org/workflow/search-safari-and-chrome-tabs
    * workflow集散地 - http://www.packal.org/workflow-list
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
    * brew install ripgrep - 搜索一个文件夹下文本的内容，但不是模糊的，对标的是grep和rg(the_silver_searcher)
    * brew install tig - 命令行模式下，查看和比对commit历史
    * brew install htop - top的代替者
    * brew install glances - 更好的性能查看工具
    * brew install cat - bat的代替者
    * brew install onefetch - 一键查看一个repo的信息
    * sudo -H  pip3 install thefuck - 命令打错之后可以给出一些提示
    * 日志工具 - tail vs inav, 有观点认为inav更强大
    * brew install fzf - 模糊搜索文件列表工具，不搜索文件里面的内容， 其他的有pick， selecta, ctrlp, fzy, 需要比较一下
    * 处理json - fx 和 jq.node
    * 开发自己的命令行工具初始化自定义项目 - https://github.com/tj/commander.js
    * 代码命令行统计工具 -
        * brew install cloc -- 统计结果中规中矩，比较慢
        * brew install sloccount - 统计结果有亮点，但是比较慢
        * brew install loc - 统计结果中规中矩，速度较快
        * brew install tokei - 统计结果中规中矩，速度较快
        * brew install scc - 统计结果有两点，速度较快
* VIM插件
* NeoVim
    * LeaderF
        * 模糊搜索命令 - :Leaderf rg ricky
* MAC 资源集散地
    * https://github.com/donnemartin/dev-setup - 用脚本初始化环境
    * https://github.com/macdao/ocds-guide-to-setting-up-mac - 可以参考的mac设置指南
    * https://github.com/sb2nov/mac-setup - 另外一个初始开发环境的项目
    * https://github.com/serhii-londar/open-source-mac-os-apps - 开源的mac app
    * https://leohxj.gitbooks.io/a-programmer-prepares/content/index.html - 程序员的自我修养
    * https://python-web-guide.readthedocs.io/zh/latest/codingtools/codingtools.html - 开发和编程工具 不一定与Mac有关
    * https://github.com/jaywcjlove/awesome-mac - mac上可能有用的工具
    * https://github.com/hzlzh/Best-App/blob/master/README.md - 推荐了一些 付费的app