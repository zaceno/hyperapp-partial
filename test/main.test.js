require('undom/register')
const {h, app} = require('hyperapp')
const test = require('ava')
const partial = require('../src/')

//Fake requestAnimationFrame
global.requestAnimationFrame = fn => setTimeout(fn, 0);

//make Element serializable via .toString()
(_ => {
    const attr = a => ` ${a.name}="${enc(a.value)}"`;
    const enc = s => s.replace(/[&'"<>]/g, a => `&#${a};`);
    function serialize (el) {
        if (el.nodeType === 3) return enc(el.nodeValue)
        return '<' + el.nodeName.toLowerCase() + el.attributes.map(attr).join('') + (
            (el.childNodes.length === 0) ? ' />' :
            ('>' + el.childNodes.map(serialize).join('') + '</' + el.nodeName.toLowerCase() + '>')
        )
    }
    Element.prototype.toString = function () {return serialize(this)}
})()

//Condense prettified html to match what serializes from Element
const condenseHTML = html =>
    html
    .replace(/\n/g, '')
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '')
    .replace(/\>\s+/g, '>')
    .replace(/\s+</g, '<')

//test app's rendered html against expected html
const isHTML = (t, html) => t.is(t.context.container.childNodes[0].toString(), condenseHTML(html))

test.beforeEach('make container for test', t => {
    let el = document.createElement('div')
    document.body.appendChild(el)
    t.context.container = el
})

test.afterEach('clean up dom', t => {
    document.body.removeChild(t.context.container)
})

test.cb('partial adds state with scope', t => {
    const scope = 'myscope'
    const scopedState = {foo: 'a', bar: {baz: 'b'}} 
    const mainState = {bing: 'baz'}
    const expectedState = Object.assign(mainState, {[scope]: scopedState})
    const mixin = partial.mixin(scope, emit => ({state: scopedState}))

    app({
        root: t.context.container,
        state: mainState,
        mixins: [partial, mixin],
        view: _ => h('div', {}, []),
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => {
                    t.deepEqual(state, expectedState)
                    t.end()
                }, 0)
                return view
            }
        }
    })

})



test.cb('partial adds actions with scope', t => {
    const scope = 'myscope'
    const scopedActions = {foo: _ => {}, bar: {baz: _ => {}}} 
    const mainActions = {bing: _ => {}}
    const mixin = partial.mixin(scope, emit => ({actions: scopedActions}))

    app({
        root: t.context.container,
        state: {foo: 'bar'},
        actions: mainActions,
        mixins: [partial, mixin],
        view: _ => h('div', {}, []),
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => {
                    t.is(typeof actions.bing, 'function')
                    t.is(typeof actions[scope].foo, 'function')
                    t.is(typeof actions[scope].bar.baz, 'function')
                    t.end()
                }, 0)
                return view
            }
        }
    })

})


test.cb('partial merges events', t => {
    
    const mixin = partial.mixin('somescope', emit => ({
        events: {
            aaa: (state, actions, data) => data + 'D',
            bbb: [
                (state, actions, data) => data + 'E',
                (state, actions, data) => data + 'F',
            ],
        }
    }))

    const emit = app({
        root: t.context.container,
        mixins: [partial, mixin],
        state: {},
        view: _ => h('div', {}, []),
        events: {
            aaa: (state, actions, data) => (data + 'A'),
            bbb: (state, actions, data) => (data + 'B'),
            ccc: (state, actions, data) => (data + 'C'),
            render: (state, actions, view) => {
                setTimeout(_ => {
                    t.is(emit('aaa', 'X'), 'XDA')
                    t.is(emit('bbb', 'X'), 'XEFB')
                    t.is(emit('ccc', 'X'), 'XC')
                    t.end()
                })
                return view
            } 
        }
    })
})

test.cb('partial actions are scoped', t => {
    t.plan(5)
    const scope = 'testscope'
    const scopedState = {scoped: 'state'}
    const testData = 'somedata'
    const mixin = partial.mixin(scope, emit => ({
        state: scopedState,
        actions: {
            dummy: _ => {},
            test: (state, actions, data) => {
                t.deepEqual(state, scopedState)
                t.is(typeof actions.test, 'function')
                t.is(typeof actions.dummy, 'function')
                t.not(typeof actions.baz, 'function')
                t.is(data, testData)
            },
        }, 
    }))
    app({
        root: t.context.container,
        state: {foo: 'bar'},
        actions: {baz: _ => {}},
        view: _ => h('div', {}, []),
        mixins: [partial, mixin],
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => {
                    actions[scope].test(testData)
                    t.end()
                }, 0)
                return view
            }
        }
    })
})



test.cb('partial events are scoped', t => {
    t.plan(3)
    const scope = 'testscope'
    const scopedState = {scoped: 'state'}
    const testData = 'somedata'
    const mixin = partial.mixin(scope, emit => ({
        state: scopedState,
        actions: {
            dummy: _ => {},
        },
        events: {
            test: (state, actions, data) => {
                t.deepEqual(state, scopedState)
                t.is(typeof actions.dummy, 'function')
                t.is(data, testData)
            },
        },
    }))
    const emit = app({
        root: t.context.container,
        state: {},
        actions: {},
        view: _ => h('div', {}, []),
        mixins: [partial, mixin],
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => {
                    emit('test', testData)
                    t.end()
                }, 0)
                return view
            }
        }
    })
})

test.cb('partial views are provided to app view', t => {
    t.plan(2)
    const scope = 'testscope'
    const mixin = partial.mixin(scope, emit => ({
        views: {
            aaa: _ => {},
            bbb: _ => {},
        }
    }))
    app({
        root: t.context.container,
        mixins: [partial, mixin],
        state: {},
        view: (state, actions, views) => {
            t.is(typeof views[scope].aaa, 'function')
            t.is(typeof views[scope].bbb, 'function')
            return h('div', {}, [])
        },
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => t.end(), 0)
                return view
            }
        }
    })
})

test.cb('partial views provided to eachother', t => {
    t.plan(4)
    const scope = 'testscope'
    const mixin = partial.mixin(scope, emit => ({
        views: {
            aaa: (state, actions, views) => {
                t.is(typeof views.aaa, 'function')
                t.is(typeof views.bbb, 'function')
            },
            bbb: (state, actions, views) => {
                t.is(typeof views.aaa, 'function')
                t.is(typeof views.bbb, 'function')
            },
        }
    }))
    app({
        root: t.context.container,
        mixins: [partial, mixin],
        state: {},
        view: (state, actions, views) => {
            views[scope].aaa()
            views[scope].bbb()
            return h('div', {}, [])
        },
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => t.end(), 0)
                return view
            }
        }
    })
})

test.cb('partial views can recieve props & children', t => {
    t.plan(2)
    const scope = 'testscope'
    const testProps = {foo: 'bar'}
    const testChildren = [h('p', {}, ['hello']), h('p', {}, ['world'])]
    const mixin = partial.mixin(scope, emit => ({
        views: {
            test: (state, actions, views, props, children) => {
                t.deepEqual(props, testProps)
                t.deepEqual(children, testChildren)
            } 
        }
    }))
    app({
        root: t.context.container,
        mixins: [partial, mixin],
        state: {},
        view: (state, actions, views) => {
            views[scope].test(testProps, testChildren)
            return h('div', {}, [])
        },
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => t.end(), 0)
                return view
            }
        }
    })
})

test.cb('partial views are scoped', t => {
    t.plan(3)
    const scope = 'testscope'
    const scopedState = {a:'b', c:'d'}
    const mixin = partial.mixin(scope, emit => ({
        state: scopedState,
        actions: {
            testAction1: _ => {},
            testAction2: _ => {},
        },
        views: {
            test: (state, actions) => {
                t.deepEqual(state, scopedState)
                t.is(typeof actions.testAction1, 'function')
                t.is(typeof actions.testAction2, 'function')
            }
        }
    }))
    app({
        root: t.context.container,
        mixins: [partial, mixin],
        state: {foo: 'bar'},
        actions: {baz: _ => {}},
        view: (state, actions, views) => {
            views[scope].test()
            return h('div', {}, [])
        },
        events: {
            render: (state, actions, view) => {
                setTimeout(_ => t.end(), 0)
                return view
            }
        }
    })
})
