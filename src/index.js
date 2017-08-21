const scopedUpdate = (scope, state, update) =>
val =>
    update({[scope]: Object.assign(state[scope], val)})



const scopedAction = (scope, fn) =>
(state, actions, data)  =>
    (update) => {
        const retVal = fn(state[scope], actions[scope], data)
        const sup = scopedUpdate(scope, state, update)
        if (typeof retVal === 'function') return retVal(sup)
        else return sup(retVal)
    }



const scopedEvent = (scope, fn) =>
(state, actions, data) =>
    fn(state[scope], actions[scope], data)



const scopedWidget = (scope, fn) =>
(state, actions, widgets, ...args) =>
    fn(state[scope], actions[scope], widgets[scope], ...args)



const Partial = emit => {
const widgets = {}
return {
    events: {
        'render': (state, actions, view) => (state, actions) => view(state, actions, widgets),
        
        'partial:render': (state, actions, [fn, args]) => fn(state, actions, widgets, ...args),

        'partial:register': (state, actions, [scope, name, fn]) => {
            widgets[scope] = widgets[scope] || {}
            widgets[scope][name] = (...args) => emit('partial:render', [fn, args])
        },
    }
}   
}



Partial.mixin = (scope, fn) => emit => {
const mixin = fn(emit)

const scopedMixin = {
    state: {[scope]: {}},
    actions: {[scope]: {}},
    events: {}
}

scopedMixin.state[scope] = (mixin.state || {})

for (let n in (mixin.actions || {})) {
    scopedMixin.actions[scope][n] = scopedAction(scope, mixin.actions[n])
}

for (let n in (mixin.events || {})) {
    if (typeof mixin.events[n] === 'function') scopedMixin.events[n] = scopedEvent(scope, mixin.events[n])
    else scopedMixin.events[n] = mixin.events[n].map(f => scopedEvent(scope, f))
}

for (let n in (mixin.views || {})) {
    emit('partial:register', [scope, n, scopedWidget(scope, mixin.views[n])])
}

return scopedMixin
}

module.exports = Partial