---
title: MongoDB聚合操作
date: 2021-04-14 16:52:18
tags:
- 数据库
- MongoDB
categories: 
- 数据库
- MongoDB
---

# Pipeline、Stage
<img src="pipeline.png" alt="pipeline示意图" width="50%" height="50%" stype="vertical-align:left">
```
db.collection.aggregate( [ { <stage> }, ... ] )
```

<br><br>

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

<br><br>

# 各Stage对应的常见运算符：
| $match | $group | $project |
| :- | :- | :- |
| $eq/$gt/$gte/$lt/$lte<br>$and/$or/$not/$in<br>$geoWithin/$intersect<br>...... | $sum/$avg<br>$push/$addToSet<br>$first/$last/$max/$min<br>...... | $map/$reduce/$filter<br>$range<br>$multiply/$divide/$substract/$add<br>$year/$month/$dayOfMonth/$hour/$minute/$second<br>......

<br><br>

# 实操用例
测试数据结构：
## 1. 基本功能
```
> db.game_king_user.find({aid:35, lv:{$exists:true}}, {_id:0, user_id:1, lv:1}).sort({lv:-1})skip(1).limit(1)

> {user_id:"110203678995", lv: 70}

> db.game_king_user.aggregate([
    { $match: {aid:35, lv:{$exists:true}} },
    { $sort: {lv:-1} },
    { $skip: 1 },
    { $limit: 1 },
    { $project: {_id:0, user_id:1, '等级':'$lv'} }
])

> {user_id:"110203678995", 等级: 70}
```

$sort、$skip、$limit顺序

MongoCompass


## 2. 求和
```
> db.game_king_user.aggregate([
    {
        $match: {
            lv: {
                $gt: 50
            }
        }
    }, {
        $group: {
            _id: null,
            total_a: {
                $sum: '$current_money.a'
            },
            total_b: {
                $sum: '$current_money.b'
            }
        }
    }, {
        $project: {
            '底数': '$total_a',
            '10^x': '$total_b',
            _id: 0
        }
    }
])

> {底数: 32.8047157018553, 10^x: 201}
```

## 3. 求平均
```
> db.game_king_user.aggregate([
    {
        $match: {
            aid: {
                $in: [35, 2329]
            },
            lv: {
                $gt: 1
            }
        }
    }, {
        $group: {
            _id: '$aid',
            avg_lv: {
                $avg: '$lv'
            }
        }
    }, {
        $project: {
            _id: 0,
            'AppId': '$_id',
            '平均等级': '$avg_lv'
        }
    }
])

> {AppId: 35, 平均等级: 9.8395061}, {AppId: 2329, 平均等级:8.4914285}
```


## 4. 数组展开

求所有玩家中，每种等级的角色总数？

$unwind
```
> db.students.find()
{name:'张三', score:[{subject:'语文',score:84}, {subject:'数学',score:90}]}

> db.students.aggregate([ {$unwind:'$score'} ])
{name:'张三', score:{subject:'语文',score:84}}
{name:'张三', score:{subject:'数学',score:90}}
```
```
> db.game_king_user.aggregate([
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

> {_id:80, count:3}
> {_id:56, count:2}
> ...
```


## 5. 分组统计
分段统计各个等级的玩家数目？
$bucket
```
db.game_king_user.aggregate([
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

> {_id:0, count:802}
> {_id:20, count:4}
> {_id:40, count:1}
> {_id:"Other", count:796}
```


## 6. 多表关联
$lookup
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

>{
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

<br><br>

# 参考资料
[极客时间《MongoDB高手课》](https://time.geekbang.org/course/intro/100040001)

[MongoDB官方文档 - Aggregation](https://docs.mongodb.com/manual/aggregation/)

[MongoDB Compass](https://www.mongodb.com/products/compass)
