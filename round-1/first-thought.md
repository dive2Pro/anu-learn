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


## jsx
> 在日常的使用中, 除了 react 本身以外, 不论是 smart / dump component, 使用最多的 就是 jsx
> <MyComponent {...props} />

jsx 是语法糖, 在 babel 或者 typescript 的转义过程中, <MyComponent first="bis" /> 会被转化成为:
```
    React.createElement(MyComponent, { first: 'bis'} , null )
```

`<MyComponent first="bis"><Second/></MyComponent>`则会被转化成:
```react
    React.createElement(MyComponent, 
        { first: 'bis'} , 
         React.createElement(Second, null, null)
     )
```

## createElement

> Element 是 react 的基本单位, 也是我们在 screen 上看到的. 我们不会直接的去使用它, 一般都是用作 Component 的返回值

这是一个递归的流程
Element 是 immutable 的 , 通过持续的 调用 返回不同的结果

它做了什么呢? 它的意义在哪里?
createElement 之后呢? 
具体都做了什么?

现在 带着这些疑问来看实现: 

