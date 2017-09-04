var EVENT_RENDER = 'render',
    EVENT_RENDER_WIDGET    = 'partial:render',
    EVENT_REGISTER_WIDGETS = 'partial:register';

function isPromise (x) { return x && (typeof x.then === 'function') }

function objAssign (a, b) {
    for (var n in b) a[n] = b[n]
    return a
}

function extract(path, o) {
    if (path.length === 0) {
        return o
    } else {
        return extract(path.slice(1), o[path[0]])
    }
}

function assign(path, o, v) {
    if (path.length === 1) {
        o[path[0]] = v
    } else {
        o[path[0]] = assign(path.slice(1), o[path[0]], v)
    }
    return o
}

function mergeArrayHashes (a, b) {
    var o = {}
    for (var n in a) o[n] = [].concat(a[n])
    for (var m in b) o[m] = (o[m] || []).concat(b[m])
    return o
}


function wrapFunctionTree (wrapper) {
    return function wrapTree (tree) {
        var o = {}
        for (var n in tree) {
            o[n] = (typeof tree[n] === 'function' ? wrapper : wrapTree)(tree[n], n)
        }
        return o
    }
}

function wrapArrayHash (wrapper) {
    return function (set) {
        var o = {}
        for (var n in set) {
            o[n] = typeof set[n] === 'function' ? wrapper(set[n]) : set[n].map(function (f) {return wrapper(f)})
        }
        return o
    }
}

function scopePath(scope, path) {
    var p = path ? path.slice() : []
    p.unshift(scope)
    return p
}

function scopedUpdater(update, path) {
    return function (value) {
        update(function (state) {
            if (typeof value === 'function') value = value(extract(path, state))
            return assign(path, state, objAssign(extract(path, state), value))
        })    
    }
}

function scopedAction(scope, action) {
    var originalAction = action.oa || action
    var path = scopePath(scope, originalAction.path)
    originalAction.path = path

    var myAction = function (S, A, D) {
        return function (update) {
            var x = originalAction(extract(path, S), extract(path, A), D)
            var u = scopedUpdater(update, path)
            if (isPromise(x)) return x.then(u)
            if (typeof x === 'function') return x(u)
            u(x)
        }
    }
    myAction.oa = originalAction
    return myAction
}
function scopedActionTree (scope, actions) {
    return wrapFunctionTree(function(action, n) {
        return scopedAction(scope, action, n)
    })(actions)
}

function scopedEventHash (events, scope) {
    return wrapArrayHash(function (handler) {
        return function (state, actions, data) {
            return handler(state[scope], actions[scope], data)
        }
    })(events)
}

function scopedWidgetTree (widgets, scope) {
    return wrapFunctionTree(function (widget) {
        return function (state, actions, widgets, props, children) {
            return widget(state[scope], actions[scope], widgets[scope], props, children)
        }
    })(widgets)
}

function makeWidgetTree (widgets, emit) {
    return wrapFunctionTree(function (widget) {
        return function (props, children) {
            return emit(EVENT_RENDER_WIDGET, [widget, props, children])
        }
    })(widgets)
}

function partialMixin (emit, scope, fn) {
    var mixin   = fn(emit),
        state   = (mixin.state || {}),
        actions = (mixin.actions || {}),
        events  = (mixin.events || {}),
        views   = (mixin.views || {}),
        sub;
    for (var n in (mixin.partials || {})) {
        sub = partialMixin(emit, n, mixin.partials[n])
        state[n] = sub.state
        actions[n] = sub.actions
        views[n] = sub.views
        events = mergeArrayHashes(events, sub.events)
    }
    return {
        state: state,
        actions: scopedActionTree(scope, actions),
        events: scopedEventHash(events, scope, emit),
        views: scopedWidgetTree(views, scope, emit),
    }
}


function Partial (emit) {
    var widgets = {}, events = {};
    events[EVENT_RENDER_WIDGET] = function (state, actions, args) {
        var widget   = args[0],
            props    = args[1],
            children = args[2];
        return widget(state, actions, widgets, props, children)
    }
    events[EVENT_REGISTER_WIDGETS] = function (state, actions, args) {
        widgets[args[0]] = args[1]
    }
    events[EVENT_RENDER] = function (state, actions, view) {
        return function (state, actions) {
            return view(state, actions, widgets)
        }
    }
    return { events: events }
}
Partial.mixin = function (scope, fn) {
    return function (emit) {
        var mixin = partialMixin(emit, scope, fn)
        emit(EVENT_REGISTER_WIDGETS, [scope, makeWidgetTree(mixin.views, emit)])
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