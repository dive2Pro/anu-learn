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

这是我们使用的方式, 很简单,只有 Component 和 Element , 但不涉及 update, 不涉及 props, setState 这些, 就从这里开始, 来看看React 是如何将这个 Component 渲染到真实的 DOM 上面的.

```
  var prevVnode = container._component
      rootNode
      hostParent = {
        _hostNode: container
      }
```

从 container中 获取`_component`, 一个 Vnode.
从此可以知道 在 React 中不仅是 vnode 会参与, 真实的 Node 也会记录一些对象.
那么这个 `_compoennt` 它表示的是否就是之前一轮render 时 传入的vnode?

```
  if (!prevVnode) {
    genVnodes(...args) {
      remove container children = (el) =>  if ('data-reactroot) { prevRendered = el } else {
        remove el
      }

      vnode._hostParent = hostParent

      mountVnode(vnode, parentContext, prevRendered)
    }
  }
```

出现第一个  vnode 的隐藏field `_hostParent`, 之所以说它是隐藏的是由于 在 js 中 以`_`开头的field默认是`private`的, 这也是无奈之举. 所以 vnode = : 
```
  {
    type,
    children,
    props,
    _hostParent: {
      _hostNode: container
    }
  }
```

**mountVnode**, 这是最重要的函数, 就是从这里 React 把 Vnode 转化为真实的DOM, 当然在 官方的 React中 这一步是交由 `React-DOM`或者`React-Native` 等等自己去实现的.

```
function mountVnode(vnode, parentContext, prevRendered) {
    const { vtype } = vnode

    switch(vtype) {
        case 1:
            return mountElement(vnode, parentContext, prevRendered)
        case 2:
            return mountComponent(vnode, parentContext, prevRendered)
        case 4:
            return mountStateless(vnode, parentContext, prevRendered)
        default:
            const node = prevRendered && prevRendered.nodeName === vnode.type ?
                            prevRendered
                            :   createDOMElement(vnode)
            vnode._hostNode = node
            return node
    }
}
TODO: 这里的 default 是在什么情况下出现的呢?

```
vnode更新: 
```
{
    type,
    children,
    props,
    _hostParent,
    vtype: 数字, 记录的是 vnode 的类型, 在 React 中最小的单位是 VNode, 分为几类:
          1. <h2>Hello Wolrd</h2>, 这是 Element, 以 小写字母开头
          2. <MyComponent />, 这是 Component, 以大写字母开头
          4. <MyComponent2 >, 和 2 一样的用法, 区别在于 它是 Stateless
}
```

例子中的 <App /> 的 vnode是这样的: 

```
  {
    type: App,
    children: null,
    props: null,
    _hostParent: {
      _hostNode: <div id="root">
    },
    vtype: 2
  }

```
### 进入 `mountComponent`, 
```
    const { type } = vnode
    let props = getComponentProps(vnode)

    const instance = new type(props, parentContext)

    vnode._instance = instance
    instance._currentElement = vnode
    instance.context = instance.context || parentContext
```
这里将 instance 和 vnode 做互相引用:
```
  {
    type: App,
    children: null,
    props: null,
    vtype: 2,
    _hostParent: {
      _hostNode: <div id="root">
    },
    _instance: new this.type(this.props, {})
                >| &._currentElement = this
                >| *.context = {}
  }
```
```
...
    if (instance.componentWillMount) {
        instance._disableSetState = true
        instance.componentWillMount()
        instance.state = instance._processPendingState()
        instance._disableSetState = false
    } else {
        instance.componentWillMount = null
    }
...
```
这里的给 instance 添加了 一个 flag, 在其中更新了一个生命周期函数 和 instance的 state, 为什么要这么做? 探究这个问题, 需要明确一点的是 state 的更新策略. 在 React 中, state 的更新不是 sync 的, state 的更新会触发 视图的更新, 那就必须要避免 一段 代码中多次 state更新 导致 view 更新的计算太过频繁. 这个 React做的就是引入 `事务机制`

```

    const rendered = safeRenderComponent(instance, type)

    instance._rendered =  rendered
    rendered._hostParent = vnode._hostParent

    let dom = mountVnode(rendered, getChildContext(instance, parentContext), prevRendered)

    instanceMap.set(instance, dom)
    vnode._hostNode = dom

    instance._disableSetState =false
```
> 在 React, 我们开发者担任的是指挥交通的角色, 而每一个 Component 就好像是一个繁忙的路口, 处理着无数的 Element 在 DOM 中的位置. 好在这个世界的规则是如此的精确和严密, 我们不需要担心是否有"不法分子"不听话导致的意外发生. 

Component 只关注三件事, state, props , render . 而 state 和 props 本质都是手段, 来控制 render 的返回. 纯函数的方式现在就体现出来了, 你给我的参数是一定的, 那我返回的也是一定的 --- vnode. 这是一个递归的过程, 沿途不停的接受新的组件, 不停的创造新的 vnode, Node, 不停的挂载Node 直到整个组件树都渲染和挂载完毕. 

vnode 会记录它的位置 分别为 `_hostNode` 和 `_parentNode`

eg: 
```
  function A(props) {
    return <div id="a">{props.children}</div>
  }
  render(
  <A>
    <B />
    <h2 />
  </A>,
  div#root)

  
```

**要注意的是, 此时官方的 16版本还未发布, 就是说, 每一个Component都必须有一个 rootElement**
1. _hostNode:  A : div#a, B: div#b , h2: h2
2. _parentNode: A : div#root, B: div#a, h2: div#a

更新Vnode: 
```
 {
   type,
   children,
   props,
   _vtype,
   _instance,
   _hostNode,
   _parentNode
 }
```