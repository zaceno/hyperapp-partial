# hyperapp-partial

Helps you structure your hyperapp code. Docs are a work in progress. For now: see this [example on codepen](https://codepen.io/zaceno/pen/XaVmZL?editors=0010)

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

const DogMixin = emit => {...}
const CatMixin = emit => {...}

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
