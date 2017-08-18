
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
 
const scopedActions = (scope, actions) => {
    const o = {}
    for (let n in actions) {
        o[n] = scopedAction(scope, actions[n])
    }
    return o
}



const scopedEvent = (scope, fn) =>
    (state, actions, data) =>
        fn(state[scope], actions[scope], data)

const scopedEvents = (scope, events) => {
    const o = {}
    for (let name in events) {
        if (typeof events[name] === 'function') o[name] = scopedEvent(scope, events[name])
        else o[name] = events[name].map(fn => scopedEvent(scope, fn))
    }
    return o
}



const Partial = emit => {
  
  const widgets = {}
  
  const bindWidget = (state, actions, bound, scope, name) =>
    (...args) =>
        widgets[scope][name](state[scope],actions[scope], bound[scope], ...args)
  
  const getBoundWidgets = (state, actions) => {
    const o = {}
    for (let s in widgets) {
      o[s] = {}
      for (let n in widgets[s]) {
        o[s][n] = bindWidget(state, actions, o, s, n)
      }
    }
    return o
  }
  
  const registerWidget = (state, actions, [scope, name, fn]) => {
    widgets[scope] = widgets[scope] || {}
    widgets[scope][name] = fn
  }
  
  const render = (state, actions, view) =>
    (state, actions) =>
        view(state, actions, getBoundWidgets(state, actions))
  
  return {events: {render, registerWidget}}
}

Partial.mixin = (scope, fn) =>
    (emit) => {
        const mixin = fn(emit)
        for (let n in (mixin.views || {})) {
            emit('registerWidget', [scope, n, mixin.views[n]])
        }
        return {
            state: {[scope]: mixin.state || {}},
            actions: {[scope]: scopedActions(scope, mixin.actions || {})},
            events: scopedEvents(scope, mixin.events || {}),
        }
    }


module.exports = Partial