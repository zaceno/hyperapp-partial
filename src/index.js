
function mergeArraySets (a, b) {
    var o = {}
    for (var n in a) o[n] = [].concat(a[n])
    for (var m in b) o[m] = (o[m] || []).concat(b[m])
    return o
}

function objAssign (a, b) {
    var o = {}
    for (var n in a) o[n] = a[n]
    for (var m in b) o[m] = b[m]
    return o
}

function wrapFunctionTree (wrapper) {
    return function wrapTree (tree) {
        var o = []
        for (var n in tree) {
            o[n] = (typeof tree[n] === 'function' ? wrapper : wrapTree)(tree[n])
        }
        return o
    }
}

function wrapArraySet (wrapper) {
    return function (set) {
        var o = {}
        for (var n in set) {
            o[n] = typeof set[n] === 'function' ? wrapper(set[n]) : set[n].map(function (f) {return wrapper(f)})
        }
        return o
    }
}

function scopedActionSet (actions, scope) {
    return wrapFunctionTree(function(action) {
        return function (state, actions, data) {
            return function (update) {
                var scopedUpdate = function (x) {
                    var o = {}
                    o[scope] = objAssign(state[scope], x)
                    update(o)
                }
                var retVal = action(state[scope], actions[scope], data)
                if (typeof retVal === 'function') retVal(scopedUpdate)
                else scopedUpdate(retVal)
            }
        }
    })(actions)
}

function scopedEventSet (events, scope) {
    return wrapArraySet(function (handler) {
        return function (state, actions, data) {
            return handler(state[scope], actions[scope], data)
        }
    })(events)
}

function scopedWidgetSet (widgets, scope) {
    return wrapFunctionTree(function (widget) {
        return function (state, actions, widgets, props, children) {
            return widget(state[scope], actions[scope], widgets[scope], props, children)
        }
    })(widgets)
}

function makeWidgetSet (widgets, emit) {
    return wrapFunctionTree(function (widget) {
        return function (props, children) {
            return emit('partial:render', [widget, props, children])
        }
    })(widgets)
}

function partialMixin (scope, fn, emit) {
    var mixin   = fn(emit),
        state   = (mixin.state || {}),
        actions = (mixin.actions || {}),
        events  = (mixin.events || {}),
        views   = (mixin.views || {}),
        sub;
    for (var n in (mixin.partials || {})) {
        sub = partialMixin(n, mixin.partials[n], emit)
        state[n] = sub.state
        actions[n] = sub.actions
        views[n] = sub.views
        events = mergeArraySets(events, sub.events)
    }
    return {
        state: state,
        actions: scopedActionSet(actions, scope),
        events: scopedEventSet(events, scope),
        views: scopedWidgetSet(views, scope),
    }
}


function Partial (emit) {
    var widgets = {}
    return {
        events: {
            render: function (state, actions, view) {
                return function (state, actions) {
                    return view(state, actions, widgets)
                }
            },
            'partial:render': function (state, actions, args) {
                var widget   = args[0],
                    props    = args[1],
                    children = args[2];
                return widget(state, actions, widgets, props, children)
            },
            'partial:register': function (state, actions, args) {
                widgets[args[0]] = args[1]
            }
        }
    }
}
Partial.mixin = function (scope, fn) {
    return function (emit) {
        var mixin = partialMixin(scope, fn, emit)
        emit('partial:register', [scope, makeWidgetSet(mixin.views, emit)])
        var scopedMixin = {
            state: {},
            actions: {},
            events: mixin.events
        }
        scopedMixin.state[scope] = mixin.state
        scopedMixin.actions[scope] = mixin.actions
        return scopedMixin
    }
}

module.exports = Partial