import {options} from './util'
export const scheduler = {
    list: [],
    count: 0 ,
    add: function(el) {
        this.count = this.list.push(el)
    },
    addAndRun: function(el) {
        this.add(el)
        setTimeout(() => {
            this.run()
        }, 0)
    },
    run: function() {
        if (this.count === 0) {
            return
        }
        this.count = 0

        this.list.splice(0).forEach(function(instance) {
            if (typeNumber(instance) === 5) {
                instance()
                return
            }

            if (instance._pendingCallbacks.length) {
                instance._pendingCallbacks.splice(0).forEach(function(fn){
                    fn.call(instance)
                })
            }

            if (instance.componentDidMount) {
                instance._updating = true
                instance.componentDidMount()
                instance.componentDidMount = instance._updating = false
                instance._hasDidMount = true

                if (instance._pendingStates.length && !instance._disableSetStates) {
                    options.refreshComponent(instance)
                }
            }
        })
    }
}