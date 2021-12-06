---
title: Mongodb查询数组元素
notshow: false
date: 2021-12-06 17:18:59
tags:
- 数据库
- MongoDB
categories:
- 数据库
- MongoDB
---

需求：
数据长这样，arr内的数量可能很大
```
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "name" : "haha",
        "arr" : [{"petname" : "lala"}, {"petname" : "lolo"}]
}
```
比如查询下标0或者petname等于lala时希望返回的结果
```
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"petname" : "lala"}]
}
```
像下面这样查询时，判断的是该文档是否满足要求，满足则返回了整个文档
```
> db.test.find({'name':'haha', 'arr.petname':'lala'})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "name" : "haha",
        "arr" : [{"petname" : "lala"}, {"petname" : "lolo"}]
}
```

办法：
有两种写法可以满足要求：
1. {'arr.$':1}
```
> db.test.find({'name':'haha', 'arr.petname':'lala'}, {'arr.$':1})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"petname" : "lala"}]
}
```
注意1：{'arr.$':1}这里的1只要是大于0的数效果都一样，填0会报错。
注意2：如果数组中存在多个petname等于lala的数据，只会返回匹配的第一个

2. $elemMatch
```
> db.test.find({'name':'haha'}, {'arr':{$elemMatch:{'petname':'lala'}}})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"petname" : "lala"}]
}
```
注意：如果数组中存在多个petname等于lala的数据，只会返回匹配的第一个

关于下标：
暂未发现可以直接通过数组下标进行匹配的查询办法。。Orz
可以通过在文档中添加idx关键字曲线救国
文档改成这样
```
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "name" : "haha",
        "arr" : [
                {"idx":0, "petname" : "lala"},
                {"idx":1, "petname" : "lolo"}
        ]
}
```
然后就可以
1. {'arr.$' : 1}
```
> db.test.find({'name':'haha', 'arr.idx':0}, {'arr.$':1})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"idx" : 0, "petname" : "lala"}]
}
> db.test.find({'name':'haha', 'arr.idx':1}, {'arr.$':1})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"idx" : 1, "petname" : "lolo"}]
}
```

2. $elemMatch
```
> db.test.find({'name':'haha'}, {'arr':{$elemMatch:{'idx':0}}})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"idx" : 0, "petname" : "lala"}]
}
> db.test.find({'name':'hehe'}, {'arr':{$elemMatch:{'idx':1}}})
{
        "_id" : ObjectId("5e8d98d478a42a4726fef505"),
        "arr" : [{"idx" : 1, "petname" : "lolo"}]
}
```
