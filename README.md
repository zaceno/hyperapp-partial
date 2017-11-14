# hyperapp-partial

Simplify composing apps from smaller, encapsulating parts. Keeps down the cognitive load of a complex hyperapp-application

*Docs are w i p.*

The main features:

- Assemble your state and actions tree using the `partials` prop, in your app props, and partials.
- Define a function to run on startup, in your partials, with the `init` prop
- Define getters which have the current state & actions (and other getters) partially applied each render, in your partials' `views` prop.
- Access the views/getters as the third argument to `view` of your app props.

Example of an app composed with hyperapp-partial: https://github.com/zaceno/synth-sequencer


## Installation

Install from NPM:

```
npm install hyperapp-partial
```

or from CDN (add to your html `<head>` tag):

```html
    <script src="https://unpkg.com/hyperapp-partial"></script>
```


