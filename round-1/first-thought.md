# 如何写一个 React

目标: 
1. 熟悉 react 的生命流程
2. 关注 react 的渲染机制
3. 了解 react 如何优化
4. 深入 react 内部实现, 以期掌握 react 的方方面面

小项: 
- [ ] createElement
- [ ] render
- [ ] setState
- [ ] propTypes
- [ ] diff 算法
- [x] jsx 语法
- [ ] Component
- [ ] Element
- [ ] cloneElement 
## jsx
> 在日常的使用中, 除了 react 本身以外, 不论是 smart / dump component, 使用最多的 就是 jsx
> <MyComponent {...props} />

jsx 是语法糖, 在 babel 或者 typescript 的转义过程中, <MyComponent first="bis" /> 会被转化成为:
```
    React.createElement(MyComponent, { first: 'bis'} , null )
```

`<MyComponent first="bis"><Second/><Thrid/></MyComponent>`则会被转化成:
```react
    React.createElement(MyComponent, 
        { first: 'bis'} , 
         React.createElement(Second, null, null),
         React.createElement(Third, null, null)
     )
```

## createElement

> Element 是 react 的基本单位, 也是我们在 screen 上看到的. 我们不会直接的去使用它, 一般都是用作 Component 的返回值

这是一个递归的流程
Element 是 immutable 的 , 通过持续的 调用 返回不同的结果

它做了什么呢? ≠它的意义在哪里?
createElement 之后呢? 

现在 带着这些疑问来看实现: 

TO SEE : createElement.js

* 答 : 
    1. 具体做了什么?  
        将在 jsx 中描绘的父子组件关系 收集起来, 并 flatten array child, 使其便于处理
    2. 意义在哪里?
        将 React 的 组件🌲构成 转化成 对象的形式, 形成这样一套约束 , 通过跨平台的 渲染方案,达到了 learn once , run everyWhere
    3. createElement 之后 ?
        这样的 一个描述 组件🌲的对象生成后, 交给 ReactDOM (render) 或者 React-Native 来渲染,  

## cloneElement

将新的 props 和 exits element 中的 props 进行 merge 得到 props

将 新的 children 替代 exits 的 children

## Component 
1. 它是什么? 
    在 react 中, 一段可以重复利用的代码, 它有自己的功能和逻辑. 
    可以由多个不同的 Component 组合而成
    其结果返回 可以是 Element/Components, 或者 Strings , Array 和 numbers
2. 它的功能有哪些? 
    - props 
        1. readOnly
        2. passed down from parent Component
    - state
        1. 
## render

### 问题
1. 它做了什么?
2. instance 具体是指什么

* 答:
    1. 具体做了什么?
        求得 各个 component / element / function 的结果, 真实 DOM reference
        这是一个递归的过程, 将 parent 和 children  DOM 结合在一起

