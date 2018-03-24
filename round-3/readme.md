2018.3.19 21:27
// 第三次阅读源码开始

// render 流程, 看懂的流程记录代码下来

// 23:26
// 进入 diff 流程


3.21 23:09

# event 事件处理
> 目前所有的 event 都是直接添加到 指点的 dom 上面, 这样 做会导致 bind 和 unbind 事件的操作变得昂贵

## 解决办法: 
  利用冒泡机制, 通过父组件 根据 event 事件的 target 来处理

  利用到的是:
    1. 通过 dom.parentNode 这个属性, 在 document 这个级别进行事件捕获, 收集沿途的 dom. 挂载在 dom 之上的 __events 则为 User 添加的方法
    2. 遍历, 然后根据 事件名 组合 Capture 和 on 事件, 进行调用. 其他的诸如 是否 阻止冒泡 则由改方法自行决定
    3. 在遍历前, 设置 transition.isInTransation = true, 避免在冒泡期间 ( 事件执行期间 ) 的 setState 方法的调用导致 state 错乱.
    4. 在遍历后, 设置 transition.isInTransation = false, 并 transition.enqueue() , 执行 state 的合并和 Component 的更新


# ref
> ref 指向的可以是 DOM Element 或者 Component instance, 取决于 ref 挂载的组件 type

## 具体做法

在 diffProps 时, 遇到 ref 属性时, 就进行收集操作
1. function : transition.enqueueCallback({  })
2. string : instance.refs['name'] = instance

## _owner

> 每一个非 Component 非 Root 的 Element, 其都会有的一个属性, 只要它处于一个 Component 的子树之中, 这个记录的就是 离他最近的 Component

### 实现细节

在 transition 的`renderWithoutSetState` 中 (  这里已经可以确定是 Component 在更新 ), 更新全局的 `CurrentOwner` 到这个 `Component` 

3.24 14:09
stateless Component 会转化为 Component, 所以这里的 vnode 的 instance 指向的是 这个 `Component`. 也因为这样做, 所以 ref 就可以指向 stateLess Component


## #comment
> 如果组件的返回结果变成空, 处理这样的情况

### 实现细节

在 transaction 中 如果 render 返回一个 null, vnode = { type: '#comment', text: 'empty' }
同时在 `diffChildren` 中, type 为 "#comment", 需要将 oldDom 删除


## option | select

> 输入组件 在 render 更新时, 需要根据 props 来确定呈现的状态. 这一部分是需要直接操作 dom 来实现的.

在 toDOM 函数中, 会`handleSpecialNode(vnode)` 来给 vnode 添加 `_wrapperState` field
在更新时, `postUpdateSelectedOptions` 传入的 vnode 中记录了 props
