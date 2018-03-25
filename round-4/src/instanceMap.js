let innerMap = window.Map


try {
    var testNode = document.createComment("")

    const map = new innerMap(),
        value = 'anu.js'
    map.set(testNode, value)
    if (map.get(testNode) !== value){
        throw new Error(`使用自定义的 Map`)
    }
} catch(e) {
    let uniqueID = 1
    innerMap = function() {
        this.map = {}
    }
    function getID(a) {
        if (a.uniqueID) {
            return "Node" + a.uniqueID
        } else {
            a.uniqueID = "_" + uniqueID ++
            return "Node" + a.uniqueID
        }
    }
    innerMap.prototype = {
        get: function(a) {
            const id = getID(a)
            return this.map[id]
        },
        set: function(name, value) {
            const id = getID(name)
            this.map[id] = value
        },
        "delete" : function(a) {
            const id = getID(a)
            delete this.map[id]
        }
    }
}

export const instanceMap =  new innerMap()