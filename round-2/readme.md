# 要旨
1. round-2 只做 anu 第一次渲染时 anu 参与的成员及其参与的时机和流程
2. 在 render 时, 只考虑 Component 和 Function 两种


2018.3.13 23:27

发现如果不弄明白传入的是组件/函数/类 话 很难进行下一步的逻辑跟踪, 所以现在要搞明白 
1. createElement 做了什么
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
2. 传入 对象的话如何处理
3. 传入函数如何处理
 