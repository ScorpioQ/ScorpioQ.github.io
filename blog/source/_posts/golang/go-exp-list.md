---
title: Golang踩坑流水账
notshow: false
date: 2021-12-06 12:40:56
tags:
- 编程语言
- Golang
categories:
- 编程语言
- Golang
---

# time.Duration和int64
```
type Duration int64

const (
   Nanosecond  Duration = 1
   Microsecond          = 1000 * Nanosecond
   Millisecond          = 1000 * Microsecond
   Second               = 1000 * Millisecond
   Minute               = 60 * Second
   Hour                 = 60 * Minute
)
```
当希望拿一个time.Duration和int/int32/int64类型进行比较时，time.Duration会变成一个纳秒的整数

```
int64(time.Second)           <--- 这是1000000000
int64(time.Millisecond)     <--- 这是1000000
int64(time.Microsecond)  <--- 这是1000
int64(time.Nanosecond)   <--- 这是1

func test(t time.Duration) {
    fmt.Println(t)
}
test(1)  <--- 参数是1ns，纳秒
```

```
var waitMs int64 = 500

startingTime := time.Now().UTC()
time.Sleep(10 * time.Millisecond)
endingTime := time.Now().UTC()

var durationAsInt64 = int64(endingTime.Sub(startingTime))

if durationAsInt64 >= waitMs {  // 不小心以为这个判断是 10 >= 500
    fmt.Printf("Over 500ms")    // 其实是 10000000 >= 500
} else {
    fmt.Printf("In 500ms")
}
```

# defer
```
func main() {
    var i int = 0
    defer func(ii int){
        fmt.Println(ii)
    }(i)
    i++
} // 输出0，参数列表的值是在defer那一行得出的

func main() {
    var i int = 0
    defer func(){
        fmt.Println(i)
    }()
    i++
} // 输出1，这种情况叫闭包，匿名函数引用外部变量
```

# map[int]struct，无法直接对struct内的变量赋值
```
type person struct {
    name string
    age  int
}

s := make(map[int]person)

s[1] = person{"tony", 20}
s[1].name = "tom"  // 报错
```
原因：
x = y这种赋值的方式，必须知道x的地址，然后才能把值y赋给x。map的value本身是不可寻址的，因为 map的扩容的时候，可能要做 key/val pair迁移。value本身地址是会改变的，不支持寻址就无法赋值。

办法：value改成指针
```
s := make(map[int]*person)

s[1] = &person{"tony", 20}
s[1].name = "tom"  // 搞定
```

# 定长数组无法直接使用sort排序
```
type Avatars [12]Avatar

func (a Avatars) Len() int {
   return len(a)
}

func (a Avatars) Swap(i, j int) {
   a[i], a[j] = a[j], a[i]
}

func (a Avatars) Less(i, j int) bool {
   return a[i].Lv > a[j].Lv
}

type Avatar struct {
   Lv         int64   `bson:"lv" json:"lv"`
   Name       string  `bson:"name" json:"name"`
   MoneySpeed *BigNum `bson:"money_speed" json:"money_speed"`
   SellPrice  *BigNum `bson:"sell_price" json:"sell_price"`
   Empty      bool    `bson:"empty" json:"empty"`
}
sort.Sort(user.AvatarList)
// 换成(a *Avatars)
```

# 日期字符串转成时间戳时，注意时区
```
startTime, _ := time.Parse("20060102", t.StartDate)
if now.After(startTime.AddDate(0, 0, 7).Add(-time.Hour * 8)) {
    //...
}
```

# Golang代码重排
注意调用栈的顺序，先访问到147行，再回到了141行，代码的执行顺序被编译器优化了
<img src="go-exp-list-1.png" alt="code" stype="horizontal-align:left">
<img src="go-exp-list-2.png" alt="panic" stype="horizontal-align:left">

# gjson.Get(...).Value()遇到整形数据时是个float64
```
func ab() interface{} {
    a := "{\"haha\":1}"
    return gjson.Get(a, "haha").Value()
}

func main() {
    v := ab()
    if vv, ok := v.(int64); ok && vv == 1 {
        fmt.Println(1, ok, vv)
    } else {
        fmt.Println(2, ok, vv)  // 2 false 0
    }
}
```
