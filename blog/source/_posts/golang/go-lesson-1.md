---
title: 《Go 语言原理与实践》课程笔记
notshow: false
date: 2021-11-16 19:53:36
tags:
- 编程语言
- Golang
- 课程
categories: 
- 编程语言
- Golang
---

课程链接：[Go 语言原理与实践](https://juejin.cn/video/7027031673329942532)
做个简单的记录

1. 开篇词｜扬帆起航，开启 Go 语言学习之旅
没什么可记录的，这个讲师吴迪是公司Kitex的作者，平时在头条圈貌似很活跃，很喜欢发言，总有种拽拽的感觉，看到真人的形象感觉和想象的差距还有点大

2. Go 中内置数据结构：slice 原理
Golang里面只有值传递
函数传参会复制，数组会有复制的开销
[得到Go程序的汇编代码的方法](https://colobu.com/2018/12/29/get-assembly-output-for-go-programs/)
> go tool compile -N -l -S once.go
> go tool compile -N -l once.go
> go build -gcflags -S once.go

3. Go 中内置数据结构：slice 实践
- slice容量增长的规则：
cap <  1024, 每次x2
cap >= 1024, 每次x1.25

- 内存分配效率
```
// 效率s3 > s2 > s1

// slice := make([]int, len, cap)
var s1 []int
for i := 0; i < 10000; i++ {
    s1 = append(s1, i)
}

s2 := make([]int, 10000)
for i := 0; i < 10000; i++ {
    s2 = append(s2, i)
}

s3 := make([]int, 0, 10000)
for i := 0; i < 10000; i++ {
    s3[i] = i
}
```

- 函数内修改slice参数可能会和原slice脱离
```
func modifySlice(s []int) {
	s = append(s, 2048)
	s[0] = 1024
}

func main() {
	var s1 []int
	for i := 0; i < 3; i++ {
		s1 = append(s1, i)
	}
	// s1 = [0, 1, 2]
	modifySlice(s1)
	// s1 = [1024, 1, 2]
	// 函数内append没触发cap变动，则会修改到原slice
	// 函数内append触发cap变动，则内外slice会完全不同了
}
```

- 空slice转json
```
var s1 []int
b1, _ := json.Marshal(s1)
// null

s2 := []int{}
b2, _ := json.Marshal(s2)
// []
```

- Bounds Checking Elimination
```
func bce(s []int) {
    _ = s[3]  // 编译器会去除0，1，2下标是否存在的检查，会使得后面的取值更快
    i := 0
    i += s[0]
    i += s[1]
    i += s[2]
    i += s[3]
}
```

4. Go 中内置数据结构：map、channel
- map作为函数参数，在函数内修改时会修改原map。和slice对比。
- map的元素不能取地址，因为它会变。`&m[1]`
- map删除key不会自动缩容
- channel是有锁的
- channel底层是个ringbuffer
- channel调用会触发调度
- 高并发、高性能编程不适合使用channel
- buffered channel 会发生两次copy
    - send goroutine -> buf
    - buf -> receive goroutine
- unbuffered channel 会发生一次copy
    - send goroutine -> receive goroutine
- unbuffered channel receive 完成send后才返回
- for + select closed channel 会造成死循环
```
ch := make(chan int)
go func() {
    ch <- 1
    close(ch)
}()
for {
    select {
        case i := <-ch:
            // ...
        default:
            break
    }
}
```

5. 通用性能优化技巧
- 使用strings.Builder代替bytes.Buffer，少一些copy，效率更好
    - string从设计上是immutable的，所以如果要从slice byte强转，必须保证底层的slice byte不会被修改也不会被回收（如sync.Pool），因为本质上是使用了同一段内存来避免内存拷贝
    - 同样的，string由于设计上是immutable的，所以如果是强转到slice byte，不可以对slice byte进行写操作，否则行为未定义
    - 如果不完全了解以上操作可能带来的影响以及后果，一定不要使用
- 函数返回值比返回指针可能更快，减少内存逃逸，减小GC压力
- atomic代替锁，锁更应该使用在需要锁一段代码的时候，而不是一个变量
```
type counter struct {
    i int32
    m sync.Mutex
}

func addOne(c *counter) {
    c.m.Lock()
    c.i++
    c.m.Unlock()
}

// 这样更快
type counter struct {
    i int32
}

func addOne(c *counter) {
    atomic.AddInt32(&c.i, 1)
}
```
- sync.Pool分配回收不应该跨goroutine
- 更快的json库，github.com/bytedance/sonic

6. 锁的适用场景与最佳实践
