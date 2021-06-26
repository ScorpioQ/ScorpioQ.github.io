---
title: MongoDB聚合操作
notshow: false
date: 2021-04-14 16:52:18
tags:
- 数据库
- MongoDB
categories: 
- 数据库
- MongoDB
---

MongoDB中聚合操作是将查询到的数据通过一个流水线，经一次或多次处理后返回结果的操作。比如经过若干条件筛选后，分组统计平均值、求和等等。

# Pipeline、Stage
<img src="pipeline.png" alt="pipeline示意图" width="50%" height="50%" stype="vertical-align:left">
```
db.collection.aggregate( [ { <stage> }, ... ] )
```


# Stage常见操作符
| Stage | 作用 | 对应SQL |
| :-: | :-: | :-: |
| $match | 条件过滤 | WHERE |
| $project | 投影 | AS |
| $sort | 排序 | ORDER BY |
| $group | 分组 | GROUP BY |
| $skip | 跳过 | SKIP |
| $limit | 结果限制 | LIMIT |
| $lookup | 左外连接 | LEFT OUTER JOIN |
| $unwind | 展开数组 |  |
| $graphLookup | 图搜索 |  |
| $bucket | 分桶 |  |
| $facet | 多个聚合操作 |  |

所有操作符：[MongoDB Manual - Aggregation Pipeline Quick Reference](https://docs.mongodb.com/manual/meta/aggregation-quick-reference/)


# 各Stage对应的常见运算符
| $match | $group | $project |
| :- | :- | :- |
| $eq/$gt/$gte/$lt/$lte<br>$and/$or/$not/$in<br>$geoWithin/$intersect<br>...... | $sum/$avg<br>$push/$addToSet<br>$first/$last/$max/$min<br>...... | $map/$reduce/$filter<br>$range<br>$multiply/$divide/$substract/$add<br>$year/$month/$dayOfMonth/$hour/$minute/$second<br>......


# 实操用例
测试数据结构：
```
> db.orders.findOne()
{
    _id: ObjectId("5dbe7a545368f69de2b4d36e"),
    user_id: '1000001',
    lv: 11,
    sex: 'male',
    current_money: 100,
    avatar_list: [
        {
            name: '小强',
            lv: 100,
            type: '近战'
        },
        {
            name: '小刚',
            lv: 150,
            type: '法系'
        }
    ]
}
```

## 1. 基本功能
一些简单的查询操作使用普通的查询命令与聚合命令的对比
```
> db.collection.find({lv:{$exists:true}}, {_id:0, user_id:1, lv:1}).sort({lv:-1})skip(1).limit(1)
{user_id:"110203678995", lv: 70}

> db.collection.aggregate([
    { $match: {lv:{$exists:true}} },
    { $sort: {lv:-1} },
    { $skip: 1 },
    { $limit: 1 },
    { $project: {_id:0, user_id:1, '等级':'$lv'} }
])
{user_id:"110203678995", 等级: 70}
```

$sort、$skip、$limit顺序


## 2. 求和
求50级以上玩家总共有多少钱？
```
> db.collection.aggregate([
    {
        $match: {
            lv: {
                $gt: 50
            }
        }
    }, {
        $group: {
            _id: null,
            total: {
                $sum: '$current_money'
            }
        }
    }, {
        $project: {
            '总计': '$total',
            _id: 0
        }
    }
])
{总计: 1000000}
```

## 3. 求平均
求10级以上的男性玩家的平均等级是多少？
```
> db.collection.aggregate([
    {
        $match: {
            sex: {
                $in: ['male']
            },
            lv: {
                $gt: 10
            }
        }
    }, {
        $group: {
            _id: '$sex',
            avg_lv: {
                $avg: '$lv'
            }
        }
    }, {
        $project: {
            _id: 0,
            '性别': '$_id',
            '平均等级': '$avg_lv'
        }
    }
])
{性别: 'male', 平均等级: 9.8395061}, {性别: 'male', 平均等级:8.4914285}
```


## 4. 数组展开
$unwind，操作符功能示例：
```
> db.students.find()
{name:'张三', score:[{subject:'语文',score:84}, {subject:'数学',score:90}]}

> db.students.aggregate([ {$unwind:'$score'} ])
{name:'张三', score:{subject:'语文',score:84}}
{name:'张三', score:{subject:'数学',score:90}}
```
求所有玩家的游戏人物中，每种等级的角色总数？
```
> db.collection.aggregate([
    {
        $unwind: '$avatar_list'
    }, {
        $group: {
            _id: '$avatar_list.lv',
            count: {
                $sum: 1
            }
        }
    }
])
{_id:80, count:3}
{_id:56, count:2}
...
```


## 5. 分组统计
分段统计各个等级的玩家数目？
$bucket
```
db.collection.aggregate([
    {
        $bucket: {
            groupBy: '$lv',
            boundaries: [0, 20, 40, 60],  // [0, 20), [20, 40), [40, 60)
            default: 'Other',  // 不属于上述区间内的
            output: {
                count: {
                    $sum: 1
                },
            }
        }
    }
])
{_id:0, count:802}
{_id:20, count:4}
{_id:40, count:1}
{_id:"Other", count:796}
```


## 6. 多表关联
$lookup，操作符功能示例：
```
> db.product.find()
{ "_id" : 1, "productname" : "商品1", "price" : 15 }
{ "_id" : 2, "productname" : "商品2", "price" : 36 }

> db.orders.find()
{ "_id" : 1, "pid" : 1, "ordername" : "订单1" }
{ "_id" : 2, "pid" : 2, "ordername" : "订单2" }
{ "_id" : 3, "pid" : 2, "ordername" : "订单3" }
{ "_id" : 4, "pid" : 1, "ordername" : "订单4" }
```
```
> db.product.aggregate([
    {
        $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "pid",
            as: "inventory_docs"
        }
    }
])
{
    "_id":1,
    "productname":"商品1",
    "price":15,
    "inventory_docs":[
        {
            "_id":1,
            "pid":1,
            "ordername":"订单1"
        },
        {
            "_id":4,
            "pid":1,
            "ordername":"订单4"
        }
    ]
}
{
    "_id":2,
    "productname":"商品2",
    "price":36,
    "inventory_docs":[
        {
            "_id":2,
            "pid":2,
            "ordername":"订单2"
        },
        {
            "_id":3,
            "pid":2,
            "ordername":"订单3"
        }
    ]
}
```


# MongoDB Compass
这是官方提供的一个GUI工具，用来做聚合操作非常直观方便。每一个Stage可以单独显示处理后的结果示例，可以方便的调试。
<img src="mongodb_compass.png" alt="pipeline示意图" width="100%" height="100%" stype="vertical-align:left">

# 参考资料
[极客时间《MongoDB高手课》](https://time.geekbang.org/course/intro/100040001)
[MongoDB官方文档 - Aggregation](https://docs.mongodb.com/manual/aggregation/)
[MongoDB Compass](https://www.mongodb.com/products/compass)
