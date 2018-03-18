# 要旨
1. round-2 只做 anu 第一次渲染时 anu 参与的成员及其参与的时机和流程
2. 在 render 时, 只考虑 Component 和 Function 两种


2018.3.13 23:27

发现如果不弄明白传入的是组件/函数/类 话 很难进行下一步的逻辑跟踪, 所以现在要搞明白 
1. createElement 做了什么:

> 接受的参数 1. type , 不管传入的是什么, 对其进行分类

分类的依据是:
  就是它 本身 的 类型, 如果
    1. string , 表示传入的是一个 element, 可以是 'h2', 可以是 '1', 可以是 svg ..., 返回的统统都是 createElementShape(...args) 的结果
    2. function, 因为 js 中 class 是基于 function 实现的, 所以这里返回的就是 createComponentShape(...args) 的结果
  返回的是什么?
    vnode 的数据结构是这样的 :
    ```
      {
        Type: number,
        type: any  // 和 createElement 第一个参数一致
        props, // ...
        children, // ...
        DOMNode,  // TODO
        instance, // TODO
        index: number // TODO
        nodeName:  // TODO
        key:    // TODO
      }
    ```
2. 传入 的 subject  的不同处理
  - <MyComponent /> 和 使用 h(component class) 是一样的, 他们都会被转化成为 vnode
  - Component class , 如果带 render field , 直接 使用createClass 去将其转化为 vnode
  - Function , 同样会 createClass 去处理
  - ...
3. 传入函数如何处理
  通过 执行一次拿到结果 vnode
  - 如果其返回的仍然是一个 函数 将其设置为一个 Component 的render 函数
  - 返回的是 已经是一个 vnode, 用一个 function 包裹它

  最后通过托管 prototype 到 Component, 完成 Component 化
2018.3.14 16:50

1.createNode 中需要处理 vnode 中的 instance, ['--thrown'] 和 ['--vnode'] 属性, 弄明白他的处理流程
  - 
  - instance : 在 extractComponentNode 中 `new type(propsb)` 赋值

// 23:27
> ~~~余下两个是在 应该是在Component 中~~~
  - ['--vnode'] 
    1. ```Component.render``` 返回 的 root 也是 `Component` 的话
      1. 子 Component 记录他的 parent Component vnode
      2. 父 Component 记录的是 root 子 Component 的 vnode
    2. 返回的是 其他的话, instance 此时一直是 null , 那么 记录的只有 parent 子 root Component

-- 18.3.15 16:40
  - ['--thrown'] : TODO:  预留, 目前并没有实现 

  createNode 返回递归并且已经创建真实 DOM , 建立 children 和 parent DOM Node 之间关系的 `Node`


# Component

- forceUpdate
    1. 重新 render 一次
    2. 比较Type 
      - 同 : 
          - TextShape : 直接替换 DOMNode.nodeValue
          - Other : reconcileNodes, 这里进入 diff 算法
      - 异 : replaceRootNode
- setState

// 16. 11:13

> 现在要进入 setState 使 Component 更新的流程
// 16:31

1.  首先在 setState 的时候要 shouldComponentUpdate
  - false return
  - true continue 
  更新 state 到 最新的
2.  componentReceiveProps 目前是放在 了 Component 的 constructor 方法中 . 现在的做法是 每一次 props 的更改都会重新 new 一个 对象出来, 我认为这个在之后会被改变.

3.  componentWillUpdate 
   extractRenderNode -> 通过重新 render 返回新的 Component / Element  =>  newNode
   oldNode = this['--vnode'] 

    比较两者的节点类型:
      - 同 , 进入 diff 算法  reconcileNodes
      - 异 , 直接替换   replaceRootNode -> oldNode.DOMNode.parentNode.replaceChild(createNode(newNode), oldNode.DOMNode)

4.  reconcileNodes
    目的在于 找出 children 中的各个  新旧 child 的不同点 , 该不同点即用于 DOMNode 操作新 node
    // 18.3.18 23:35
     reconcileKeys
     已经在 方法的 doc 中写出

这一版本的 copy & read 代码 告一段落.

TODO: 18.3.20 回顾并理清逻辑, 重点在 大的抽象上面

下面会进入 round-3, 此时 代码被重写, 所以这又是一次 copy & read 的过程 FIGHTING 👨‍💻‍👨‍💻‍
