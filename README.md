# hyperapp-partial

Helps you structure your hyperapp code.

Some head-first examples: 

- [Tab-layout partial](https://codepen.io/zaceno/pen/GvLQOB)
- [Demo various features](https://codepen.io/zaceno/pen/XaVmZL)

Incompatible with versions of hyperapp < 0.12.1

## Should I use this?

Depends. Everyone's app is different, and everyone likes to code in different ways. But if this sounds familiar, you may want to give it a try:

- You're using mixins and namespaces to separate concerns, but you dislike how you need to type the namespace of a mixin all over.
- You're annoyed at how much you have to pass properties down the chain of components.

## I'm sold! How do I get it?

### Install using npm

```
npm install hyperapp-partial
```

And `require` (or `import`, if you're using es6 modules) in your project:

```js

const partial = require('hyperapp-partial')

```

### or include in HTML from CDN

Add this to the `<head>` of your page:

```html

<script src="https://unpkg.com/hyperapp-partial"></script>

```

this will export `partial` in the global scope.

### then use it in your app:

To declare a "partial" (explained further below), wrap your mixin's in `partial.mixin('namespace', ...)`. Make sure to use a unique namespace for each. Then mix your partials into your app *taking care to mix in `partial` first*.

```js

const DogMixin = emit => ({...})
const CatMixin = emit => ({...})

app({
  mixins: [
    partial,
    partial.mixin('dogs', DogMixin),
    partial.mixin('cats', CatMixin),
  ],
  ...
})
```

If you just followed all those instructions, you're probably wondering at this point: "what does `partial.mixin` actuall *do*?" Read on!

## Partial Mixins

Every new feature/concern you add to an app, will bring with it some state properties and related actions to operate on that state. After only a few features, your app may become hard to read and prone to bugs.

To create order, Hyperapp allows you to:

- Declare groups of related state properties, actions and events together, using [*mixins*], to help you separate concerns (at least visually)

- Avoid naming collisions by nesting state properties and actions under a [*namespace*]

However, using mixins and namespaces together makes your mixins look a little silly, since you'll usually have only one namespace per mixin, and it will be repetead all over. Removing this redundancy is the first thing hyperapp-partial can help you with.

By using `partial.mixin` you can declare a namespace once, and this will become the namespace for state and actions of that mixin, without you having to declare it in the mixin itself.


```js

const myPartial = partial.mixin('myPartial', emit => ({
    state: {
      propX: ...,
      propY: ...,
    },
    actions: {
      add: ...,
      subtract: ...,
    }
}))

app({
  mixins: [partial, myPartial],
  state: {
    propZ: ...,
  },
  actions: {
    multiply: ...,
  }
  
})

/*
  Now the app's state tree looks like:
  {
    myPartial: {
      propX: ...,
      propY: ...,
    },
    propZ: ...
  }

  and the actions object, like this:
  {
    myPartial: {
      add: ...,
      subtract: ...,
    },
    multiply: ...m
  }


*/

```

What's more, *you won't ever need to refer to the namespace within the mixin itself*.

The state and actions are *scoped* to the namespace before being passed to actions and events. 

```js

partial.mixin('myPartial', emit => ({
  state: {
    prop1: ...,
    prop2: ...,
  },
  actions: {
    doA: ...,
    doB: (state, actions) => {
      /*
      Here the state object looks like:

      {
        prop1: ...,
        prop2: ...,
      }

      and the actions object looks like:

      {
        doA: ...
        doB: ...
      }

      - regardless of whatever other state may
      be in the main app or other mixins.
      */
    }
  }
}))

```



When you want to update the state with an action (wether returning or using thunks), the new values you provide will be wrapped inside the mixin's namespace under the hood.

```js

partial.mixin('myPartial', emit => ({
  ...
  actions: {
    /*
      Equivalent to a regular action doing:

      const subState = state.myPartial
      subState.value += 1
      return {myPartial: subState}
    */
    increment: state => ({value: state.value +1 })
  }
  ...
}))

```


## Partial Views

A particular feature will often require not just a handful of related state and actions, but also one or more components (i e, a function which returns a virtual tree). These components may be rendered deep inside your main view, and you need to take care to pass all the relevant properties "down the chain" -- handling the namespace as you go (since this is happening in the main app, not inside the mixin)

Partial views aims to help with this. In your partial mixin, you may define a property `views` -- an object which holds one or more named components.

```jsx

const myPartial = partial.mixin('myPartial', emit => ({
  views: {
    affirmative: _ => <b>Yes</b>,
    negative: _ => <b>No</b>,
  }
}))

```

Views from all partials are collected in an object, grouped by namespace (same as state and actions), and passed to the main app's `view` as a third argument:


```jsx

app({
  mixins: [partial, myPartial],
  state: {},
  view: (state, actions, V) => <p>
    You say <V.myPartial.affirmative />,
    I say <V.myPartial.negative />
  </p>
  /*
    ... renders: <p>
      You say <b>Yes</b>,
      I say <b>No</b>
    </p>
  */>
})

```

With partial views, you don't need to worry about passing along the appropriate state and actions, they will always be called with the state and actions of the partial, as first and second arguments respectively.

```jsx

const myPartial = partial.mixin('myPartial', emit => ({
  state: {
    name: 'John Doe',
  },
  actions: {
    input: (state, actions, value) => ({name: value})
  },
  views: {
    input: (state, actions) => <input
      type="text",
      value={state.name},
      oninput={ev => actions.input(ev.currentTarget.value)}
    />,
    greeting: (state) => <h1>Hello, {state.name}!</h1>
  }
}))

app({
  mixins: [partial, myPartial],
  state: {},
  view: (_, __, V) => <main>
    <V.myPartial.greeting />
    <p>
      Please state your name:
      <V.myPartial.input />
    </p>
  </main>
})
```

So can you pass anything else to partial views? Yes of course, all arguments passed to partial views will become the 4th, 5th, ... arguments to the function. When using JSX (as in the examples) the 4th argument will be the properties, and 5th argument will be children.

The *third* argument, is analogous to the third argument to the main app view. It is the collection of partial views -- but just like state and actions, *scoped* to the partial. This is mainly useful if you have components you wish to reusue within those partial views you mean to be used from the main view.

```jsx

const myCounter = partial.mixin('myCounter', emit => ({
  
  state: {
    value: 10,
  },
  
  actions: {
    change: (state, _, v) => ({value: state.value + v})
  },
  
  views: {
    
    change: (_, {change}, __, {amount, label}) =>
      <button
        onclick={_ => change(amount)}
      >
        {label}
      </button>,

    main: ({value}, _, V) => <p>
      <V.change amount={-1} label="-" />
      {value}
      <V.change amount={1} label="+" />
    </p>

  }
}))
```

## Async actions in partials

### Handle promises in actions

When you need to, for example, fetch some data to put in your state, it is appropriate to use [thunks]

```js
actions: {
  reloadData: (state, actions) => update => {
    update({fetching: true})
    fetch(someurl)
    .then(data => {
      update({
          fetching: false,
          data: data
      })
    })
  }
}
```

The update function works just like in normal hyperapp, but operates on the scoped state. 

Beware, however, that if you need to calculate what you `update` when a promise resolves, that you don't use the state passed into the action. That state is old! Instead, pass a [reducer] to
your update function, to access the latest state. 

```js
actions: {
  fetchMore: (state, actions) => update => {
    update({fetching: true})
    fetch(someurl)
    .then(data => {
      update(state => {
        return {
          fetching: false,
          data: data,
          fetchedSoFar: state.fetchedSoFar + data.length
        }
      })
    })
  }
}
```

The state provided to the reducer will be scoped to the partial. Everything should work as if your partial were a hyperapp-app unto itself.

### Updating state when a promise resolves

If you use a promise in your action, and *return* that promise, the state will be updated with
what that promise resolves to.

This is a departure from how regular hyperapp actions behave, as they will simply return the promise. The same behavior can be achieved for regular hyperapp actions with a mixin.

## Partials in Partials

Suppose your app is divided into a few major sections, and you described each with a partial. Now suppose there is a particular stateful UI-element repeated in some of the sections. It would be convenient to encapsulate that element's state, actions, and views into a partial, so it could be reused. This is why *partials can have partials*.

When you declare partials in the main app, you need to wrap your partial definitions in `partial.mixin(scope, ...)` -- but when you add a child partial to a parent partial, you simply declare it in the parent's `partials` property.

```
const childPartial = emit => ({
  state: {foo: 'foo'},
  actions: {do: ...}
})

const parentPartial = emit => ({
  ...,
  partials: {
    child: childPartial
  }
}}

app({
  mixins: [partial, partial.mixin('parent', parentPartial)
})
```

In this example, the parentPartial can access the childPartial's state as `state.child.foo`. The main app can access it via: `state.parent.child.foo`. Corresponding access rules apply for actions and views.

There is no limit to how deep the partial-hierarchy may go.


## Communication between partials

Partials may seem similar to the stateful components of other frameworks. The main difference is that the partials's state, actions and views all live in the *global* state/action/view trees. It is only *within* a partial we are limited to particulart branches of the trees.

This is convenient, but comes at the expense of *global access*.

Ideally, you would structure your app so this is not a problem. Try to make it so that any partial which needs access to other partials lives *above* them in the hierarchy.

This is not always possible, though. In those cases, partials may not be the solution. Consider letting all the interacting state and actions live together at the same level.

If that doesn't work for you, there are always custom events.

When something significant happens in one partial (that another partial cares about) you may `emit('mypartial:somethingHappened', withData)`. The other partial may react to these events by handling `'mypartial:somethingHappened'` in its `events` property.

Since calls to `emit` returns whatever the last handler of that event returns, you can also use custom events to read data from outside the scope of your partial. 

For instance, you can set up this event-handler:

```
app({
  ...
  events: {
    ...,
    globalScope: (state, actions, fn) => fn(state, actions)
  }
})
```

Now you may use that event to access any part of the state, or call any action, from within your partial:

```
const someGlobalState = emit('globalScope', state => state.somewhere.beyond.myscope)
```
