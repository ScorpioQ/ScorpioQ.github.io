---
title: Hexo+Github Pages 博客搭建
date: 2021-03-26 22:15:36
tags: [Hexo]
---

环境：macOS 11.2.3


# Github配置
很久很久以前的某一天，我配置好了，忘了是怎么配置的了，有空补上这一段。。


# 安装Node.js
```
$ brew install npm
```


# 安装Hexo
```
$ npm install -g hexo
```


# 生成Blog代码
GitHub上先配置好github pages的仓库，然后拉到本地。
```
$ git clone https://github.com/ScorpioQ/ScorpioQ.github.io.git
$ cd ScorpioQ.github.io
$ hexo init blog
$ hexo g
$ hexo s
```
就可以访问 http://localhost:4000 查看效果。
<br/>
<img src="test_init.png" alt="初始化效果图" width="50%" height="50%" stype="vertical-align:middle">
<br/>


# 写文章
```
$ hexo new '新文章'
```
就会在 git_root/blog/source/_posts/ 下生成一个新文件“新文章.md”。
<br/>
<img src="test_article_md.png" alt="新文章测试效果图" width="30%" height="30%" stype="vertical-align:middle">
再次 `hexo g` + `hexo s` 之后就可以在 http://localhost:4000 看到效果。
<br/>
<img src="test_article.png" alt="新文章测试效果图" width="50%" height="50%" stype="vertical-align:middle">
<br/>


# 更换主题
```
// 在blog目录下拉取
$ git clone https://github.com/iissnan/hexo-theme-next themes/next
```
打开blog配置文件_config.yml，找到theme选项。
```
## Themes: https://hexo.io/themes/
theme: next
```
再次 `hexo g` + `hexo s` 之后就可以在 http://localhost:4000 看到效果。如果遇到这种错误：
<br/>
<img src="test_theme_err.png" alt="主题安装错误示意图" width="70%" height="70%" stype="vertical-align:middle">
需要额外安装一个插件：
```
$ npm i hexo-renderer-swig
```


# 部署到Github Pages
打开blog配置文件_config.yml，找到deploy选项。
```
# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: git
  repo:
    github: https://github.com/ScorpioQ/ScorpioQ.github.io.git
  branch: master
```
本地修改了Blog内容之后，一行命令即可更新到线上。
`$ hexo g -d`


# 添加评论功能
打开主题配置文件_config.yml，找到valine选项。
```
# Valine.
# You can get your appid and appkey from https://leancloud.cn
# more info please open https://valine.js.org
valine:
  enable: true
  appid: # your leancloud application appid
  appkey: # your leancloud application appkey
```
在这个地方 https://leancloud.cn 注册账号，然后创建一个应用，在“设置 > 应用Keys”里可以找到appid和appkey。Hexo还支持多种其他评论系统，有空再探索探索～
<br/>
<img src="test_comment.png" alt="评论效果图" width="50%" height="50%" stype="vertical-align:middle">
<br/>


# 添加打分功能
打开主题配置文件_config.yml，找到rating选项。
```
# Star rating support to each article.
# To get your ID visit https://widgetpack.com
rating:
  enable: true
  id:     #<app_id>
  color:  fc6423
```
在这个地方 https://widgetpack.com 注册账号，之后在页面上方就可以看到ID，“侧边栏 > Rating”可以查看评分相关记录。
<br/>
<img src="test_rating.png" alt="打分效果图" width="50%" height="50%" stype="vertical-align:middle">
<br/>