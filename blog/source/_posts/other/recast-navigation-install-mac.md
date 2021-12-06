---
title: RecastNavigation安装记录
notshow: false
date: 2021-12-06 15:40:18
tags:
- 寻路
categories:
- 游戏开发
---

Github: [RecastNavigation](https://github.com/recastnavigation/recastnavigation)

# 模块
1. Recast：负责根据提供的模型生成导航网格。
2. Detour：利用导航网格做寻路操作。
3. DetourCrowd：提供了群体寻路行为的功能。
4. Recast Demo：一个很完善的Demo，演示了这个开源库能做的所有功能。

# 入手点
## RecastDemo中生成导航网格的相关代码：
```
// recastnavigation/RecastDemo/Source/Sample_SoloMesh.cpp:371
bool Sample_SoloMesh::handleBuild()

// recastnavigation/RecastDemo/Source/Sample_TileMesh.cpp:590
bool Sample_TileMesh::handleBuild()

// recastnavigation/RecastDemo/Source/Sample_TempObstacles.cpp:1194
bool Sample_TempObstacles::handleBuild()
```

## RecastDemo中寻路的相关代码：
```
// recastnavigation/RecastDemo/Source/NavMeshTesterTool.cpp:681
void NavMeshTesterTool::recalc()
```

# 编译指引
## Mac：
1. 下载[Premake5](https://premake.github.io/download.html)，放到/usr/local/bin目录下
2. 下载[SDL2](https://www.libsdl.org/download-2.0.php)，将安装包中的SDL2.framework文件夹放到/Library/Frameworks下
3. 拉源码，git clone https://github.com/recastnavigation/recastnavigation.git
4. 切到RecastDemo目录下执行命令1premake5 xcode4
5. 用Xcode打开工程RecastDemo/Build/xcode4/recastnavigation.xcworkspace
6. 如下图所示，删掉这个白色的SDL2
<img src="recast-navigation-install-mac-1.png" alt="panic" stype="horizontal-align:left">
7. 然后选到第2步的这个SDL2文件夹
<img src="recast-navigation-install-mac-2.png" alt="panic" width="50%" height="50%" stype="horizontal-align:left">
<img src="recast-navigation-install-mac-3.png" alt="panic" width="50%" height="50%" stype="horizontal-align:left">
<img src="recast-navigation-install-mac-4.png" alt="panic" width="50%" height="50%" stype="horizontal-align:left">
8. Target选到RecastDemo，开搞～
<img src="recast-navigation-install-mac-5.png" alt="panic" width="50%" height="50%" stype="horizontal-align:left">
9. 如果遇到这个报错，说找不到RecastAssert.h，可尝试将它改成#include "RecastAssert.h"
<img src="recast-navigation-install-mac-6.png" alt="panic" stype="horizontal-align:left">
10. 然后这个Demo就跑起来了，选一个Sample，选一个Input Mesh，然后点Build，接下来就可以在地图中随意选择Start点(双指点击)和End点(单指点击)，就能显示导航路径了，更多功能慢慢探索吧。
<img src="recast-navigation-install-mac-7.png" alt="panic" stype="horizontal-align:left">


## Linux：
1. 切root，开发机上sudo -i
2. 安装SDL2，官方说每个Linux发行版到安装方式可能不同，此处给出Debian的，因为我的开发机是安装的Debian～哈哈哈～命令如下，如果提示有其他依赖，依次安装即可
apt-get install libsdl2-dev
我安装的时候提示缺少了这几个，也需要装一下
apt-get install libegl1-mesa-dev libgl1-mesa-dev libgles2-mesa-dev libglu1-mesa-dev libsdl2-dev
3. 下载[Premake5](https://premake.github.io/download.html)，放到/usr/bin/目录下
4. 切到RecastDemo目录，执行premake5 gmake
5. 切到RecastDemo/Build/gmake目录下执行命令make
6. 如果遇到以下报错，需要更新gcc到8或以上的版本
cc1plus: error: -Werror=class-memaccess: no option -Wclass-memaccess
Debian jessie 安装更新gcc：
/etc/apt/sources.list增加一行
deb http://ftp.de.debian.org/debian sid main
然后
apt-get update
apt-get install build-essential
7. 然后可以跑一下可执行文件./RecastDemo/Bin/Tests，看到All tests passed就OK了～
<img src="recast-navigation-install-mac-8.png" alt="panic" stype="horizontal-align:left">


