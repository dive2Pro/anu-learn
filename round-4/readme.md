# Round-4

> 进入这一轮, 目的是在加深理解的基础上, 再强调一轮整个框架的逻辑处理.

## TODO: 

- [ ] render 方法
- [ ] createElement
- [ ] diff 算法
- [ ] setState
- [ ] event
- [ ] Component | Element | instance | owner

> 在我看来 anu 是 正美前辈 对 React 整个框架理解透彻之后 ( 这一点可以从 anu 有能力跑通大部分 React 的官方测试看出来 ), 提炼了 React 的精华, 藉由自身出色的浏览器兼容能力, 开发出来的一款能支持 ie8 的类 React 框架. 我相信整个框架的本体处理逻辑和 React 官方大同小异, 因此在此后的行文中, React 指代的也是 anu.

## VNode

> React 中最重要的也就是 Virtual Dom 思想, 将整个组件树用 js 对象描述出来, 每一次组件树中的更新都会生成一个新的 VirtualDom, 比较新旧两颗树的异同, 再将差异应用到真正的 DOM 上面, 从而提供了从原本命令式操作 dom 转化为声明式操作 dom 的能力. 

    React 中 VNode 是最小也是最重要的单位对象, 所有的操作都是围绕着它来做文章,  它记录和参与了整个 React 在对 Dom生成, 更新, 删除这些过程中的每一个细节 . 但说白了, Vnode 就是一个对象, 现在就从 这个对象的一生开始, 慢慢揭开整个 React 的密码.

  每一个字符, Element, Component在 React 中都有一个用来它指代的 VNode, 从而将整个 DOM 抽象化了一层. 创建这个对象的方式是这样的 `React.createElement('h2', null, "Hello World!")`, 不过我们可能更熟悉`jsx` 的方式 `<h2>Hello World!</h2>`, 要牢记的一点是 这里的 jsx 和传统的 template 中的 `xml` 完全是两码事, jsx 用多了就有点难以和 前面的一种方式联系起来, 我在多次阅读和理解 React 代码的时候会遇到这种疑惑, 为什么这个对象会是一个 vnode, 好像没有在哪里创建它啊? 如果你有过和我一样的经历, 那么就要牢牢记住 --- `jsx` 是一个每一次都会调用生成` Vnode` 的函数. 它长这个样子 :
  ```
  {
    type: 'h2',
    props: null,
    children: ["Hello World!"],
    ... // 还有其他的属性
  }
  ```
  随着进程的不断推进, 我们会慢慢补充进来那些隐藏的属性.

## render

> 这里是一切 Component 的起点, 根. 

```
class App extends React.Component {
  render () {
    return <h1>Hello World</h1>
  }
}
React.render(<App />, document.getElementById('root'))
```

这是我们使用的方式, 很简单,只有 Component 和 Element ,但不涉及 update, 不涉及 props, setState 这些, 就从这里开始, 来看看React 是如何将这个 Component 渲染到真实的 DOM 上面的.




    在 React, 我们开发者担任的是指挥交通的角色, 而每一个 Component 就好像是一个繁忙的路口, 处理着无数的 Element 在 DOM 中的位置. 好在这个世界的规则是如此的精确和严密, 我们不需要担心是否有"不法分子"不听话导致的意外发生. 

