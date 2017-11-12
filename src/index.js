function wireView (state, actions, boundViews, fn) {
    return function (props, children) {
        var res = fn(state, actions, boundViews)
        return (typeof res === 'function') ? res(props, children) : res
    }
}

function getWiredViews(state, actions, views) {
    var wired = {}
    for (var name in views || {}) {
        if (typeof views[name] === 'function') {
            wired[name] = wireView(state, actions, wired, views[name])
        } else {
            wired[name] = getWiredViews(state[name], actions[name], views[name])
        }
    }
    return wired
}

function scopedInit(name, inits) {
    return inits.map(function (f) {
        return function (actions) {
            f(actions[name])
        }
    })
}

function collectPartials (opts) {
    opts.partials = opts.partials || {}
    opts.state = opts.state || {}
    opts.actions = opts.actions || {}
    opts.views = opts.views || {}
    opts.init = [].concat(opts.init || []) //make init an array
    Object.keys(opts.partials).forEach(function (name) {
        var pOpts = collectPartials(opts.partials[name])
        opts.state[name] = pOpts.state
        opts.actions[name] = pOpts.actions
        opts.views[name] = pOpts.views
        opts.init = opts.init.concat(scopedInit(name, pOpts.init))
    })
    return opts
}

export default function (app) {    
    return function (opts) {
        var collectedOpts = collectPartials(opts)
        var oView = collectedOpts.view
        collectedOpts.view = function (state, actions) {
            oView(state, actions, getWiredViews(state, actions, collectedOpts.views))
        }
        var actions = app(collectedOpts)
        collectedOpts.init.forEach(function (f) { f(actions) })
        return actions
    }
}