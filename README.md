# hyperapp-partial

Helps you structure your hyperapp code. Docs are a work in progress. For now: see this [example on codepen](https://codepen.io/zaceno/pen/XaVmZL?editors=0010)

## Intro

### When would I use this?

Your hyperapp-app started out small and simple, but you're adding more and more features. Each feature/concern brings with it some state properties, and a handful of actions to operate on those particular state properties. Code is getting verbose, and it's hard to get an overview. 

```js

app({
  state: {
    featureA_prop1: ...,
    featureB_prop2: ...,
    featureA_prop2: ...,
    featureB_prop1: ...,
  },
  actions: {
    featureA_doX: ...,
    featureB_doY: ...,
    featureA_doZ: ...,
  }
})

```

You think to yourself: "I heard somewhere you're supposed to *separate concerns*..." Hyperapp allows this to an extent, by letting you group state and actions in "namespaces":

```js
app({
  state: {
    featureA: {
      prop1: ...,
      prop2: ...,
    },
    featureB: {
      prop1: ...,
      prop2: ...,
    },
  },
  actions: {
    featureA: {
      doX: ...,
      doY: ...,
    },
    featureB: {
      doZ:...
    }
  }
})
```

Ah, much better! But it hasn't really reduced the verbosity of your actions and views. Those namespace-names are repeated all over the place, making your code more bug-prone and less readable.

Actions look like:

```js
actions: {
  ...
  featureB: {
    doZ: (state, actions) => {
      if (state.featureB.prop1 > state.featureB.prop2) {
        state.featureB.prop1 = state.featureB.prop1 - state.featureB.prop2
      } else {
        state.featureB.prop2 = state.featureB.prop2 - state.featureB.prop1
      }
      return state
    }
  }
}
```

And your view is not much better:

```jsx
view: (state, actions) => <main>
  <div class="featureA">
    Value: {state.featureA.prop1}
    <button onclick={actions.featureA.doX}>Do X</button>
    <button onclick={actions.featureA.doY}>Do Y</button>
  </div>
  <div class="featureB">
    Value: {state.featureB.prop1 + state.featureB.prop2}
    <button onclick={actions.featureB.doZ}>Do Z</button>
  </div>
</main>

```

So, if you're like me, you ask yourself: "Wouldn't it be nice, if ..."

- You could encapsulate the state, actions and views for a certain feature, declaring them *together*?
- Your could cut out the namespace, and write your actions & views as if the state & actions of the feature were the only ones in the app?

"Yes", you reply to yourself. "Yes, that would be very nice". And that's when you reach for *hyperapp-partial*.

