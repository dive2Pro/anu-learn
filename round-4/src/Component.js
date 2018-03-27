import { extend, isFn, options, clearArray } from "./util";

export function Component(props, context) {
  this.context = context;
  this.props = props;
  this.refs = {};
  this.state = null;
  this.__dirty = true;
  this.__pendingCallbacks = [];
  this.__pendingStates = [];
  this.__pendingRefs = [];
}

Component.prototype = {
  replaceState() {},
  setState(state, cb) {
    setStateImpl.call(this, state, cb);
  },
  forceUpdate(cb) {
    setStateImpl.call(this, true, cb);
  },
  __collectRefs(fn) {
    this.__pendingRefs.push(fn);
  },
  __mergeStates(props, context) {
    const n = this.__pendingStates.length;

    if (n === 0) {
      return this.state;
    }

    const states = clearArray(this.__pendingStates);

    const nextState = extend({}, this.state);

    for (let i = 0; i < n; i++) {
      const partial = states[i];
      extend(
        nextState,
        isFn(partial) ? partial.call(this, nextState, props, context) : partial
      );
    }
    return nextState;
  },
  render() {}
};

function setStateImpl(state, cb) {
  if (isFn(cb)) {
    this.__pendingCallbacks.push(cb);
  }
  // forceUpdate
  if (state === true) {
    if (!this.__dirty && (this.__dirty = true)) {
      this.__forceUpdate = true;
      options.refereshComponent(this, []);
    }
  } else {
    // setState 是异步渲染
    this.__pendingStates.push(state);
    // 子组件在 ComponentWillReiceveProps 中调用 父组件 的 setState
    if (this.__updating) {
      devolveCallbacks.call(this, "__tempUpdateCbs");
      this.__rerender = true;
    } else if (!this.__hasDidMount) {
        // 如果是在 componentDidMount 中 调用 setState 方法,
        // state 的所有回调, 延迟到 componentDidUpdate 中执行
      if (this.__hasRendered) {
        devolveCallbacks.call(this, "__tempMountCbs");
      }
      if (!this.__dirty && (this.__dirty = true)) {
        defer(() => {
          if (this.__dirty) {
            this.__pendingCallbacks = this.__tempUpdateCbs;
            options.refereshComponent(this, []);
          }
        });
      }
    } else if (!this.__dirty && (this.__dirty = true)) {
      options.refereshComponent(this, []);
    }
  }
}

function devolveCallbacks(name) {
    const args = this.__pendingCallbacks
    const list = this[name] = this[name] || []
    list.push.apply(list, args)
    this.__pendingCallbacks = []
}

var defer =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  function(job) {
    setTimeout(job, 16);
  };
