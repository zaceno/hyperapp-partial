//require('undom/register')
const test = require('ava')

//fake browser environment
const {JSDOM} = require('jsdom')
const dom = new JSDOM(`<!doctype html><html><body></body></html>`)
global.window = dom.window
global.document = dom.window.document
global.requestAnimationFrame = fn => setTimeout(fn, 0);


const partial = require('../dist/hyperapp-partial.umd.js')
const {h, app: plainApp} = require('hyperapp')
const app = partial(plainApp)
const noop = _ => {}


//Condense prettified html to match what serializes from Element
const condenseHTML = html =>
    html
    .replace(/\n/g, '')
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '')
    .replace(/\>\s+/g, '>')
    .replace(/\s+</g, '<')

//test app's rendered html against expected html
const isHTML = (t, html) => t.is(t.context.container.innerHTML, condenseHTML(html))

test.beforeEach('make container for test', t => {
    let el = document.createElement('div')
    document.body.appendChild(el)
    t.context.container = el
})

test.afterEach('clean up dom', t => {
    document.body.removeChild(t.context.container)
})

test.cb('collects state and actions for partials', t => {
    const B = {
        state: {
            baz: 'baz',
        },
        actions: {
            doB: noop,
            doC: noop,
        }
    }
    const C = {
        state: {
            bing: 'bing'
        },
        actions: {
            doD: noop,
        }
    }
    const A = {
        state: {
            foo: 'foo',
            bar: 'bar',
        },
        actions: {
            doA: noop,
        },
        partials: {
            b: B,
            c: C
        }
    }
    app({
        state: {
            zip: 'zip',
            zap: 'zap',
        },
        actions: {
            doE: noop,
        },
        partials: {
            a: A,
            c: C,
        },
        view: (state, actions) => {
            t.deepEqual(state, {
                zip: 'zip',
                zap: 'zap',
                a: {
                    foo: 'foo',
                    bar: 'bar',
                    b: {
                        baz: 'baz'
                    },
                    c: {
                        bing: 'bing'
                    }
                },
                c: {
                    bing: 'bing'
                }
            })
            t.deepEqual(Object.keys(actions.a), ['doA', 'b', 'c'])
            t.deepEqual(Object.keys(actions.a.b), ['doB', 'doC'])
            t.deepEqual(Object.keys(actions.a.c), ['doD'])
            t.deepEqual(Object.keys(actions.c), ['doD'])
            t.end()
        }
    }, t.context.container)
})

test.cb('Init is called in each partials with its actions', t => {
    t.plan(3)
    app({
        actions: {
            foo: noop,
        },
        partials: {
            a: {
                actions: {
                    bar: noop
                },
                partials: {
                    c: {
                        actions: {
                            baz: noop,
                        },
                        init: actions => {
                            t.deepEqual(Object.keys(actions), ['baz'])
                        }
                    }
                }
            },
            b: {
                actions: {
                    qux: noop,
                    zap: noop,
                },
                init: actions => {
                    t.deepEqual(Object.keys(actions), ['qux', 'zap'])                    
                }                
            }
        },
        init: actions => {
            t.deepEqual(Object.keys(actions), ['foo', 'a', 'b'])
        },
        view: _ => {
            t.end()
        }
    }, t.context.container)
})

test.cb('partial view with no props', t => {
    t.plan(2)
    const partial = {
        state: {
            foo: 'foo',
            bar: 'bar',
        },
        actions: {
            doX: noop
        },
        views: {
            testView: (state, actions) => {
                t.deepEqual(state, {foo: 'foo', bar: 'bar'})
                t.deepEqual(Object.keys(actions), ['doX'])
            }
        }
    }
    app({
        state: { baz: 'baz' },
        actions: { doY: noop },
        partials: {partial},
        view: (state, actions, views) => {
            views.partial.testView()
            t.end()
        }
    })

})

test.cb('partial with props', t => {
    t.plan(1)
    const partial = {
        views: {
            testView: (state, actions) => data => {
                t.is(data, 'test data')
            }
        }
    }
    app({
        partials: {partial},
        view: (state, actions, views) => {
            views.partial.testView('test data')
            t.end()
        }
    })
})


test.cb('partial with props & children', t => {
    t.plan(2)
    const partial = {
        views: {
            testView: (state, actions) => (props, children) => {
                t.is(props, 'test data')
                t.is(children, 'test children')
            }
        }
    }
    app({
        partials: {partial},
        view: (state, actions, views) => {
            views.partial.testView('test data', 'test children')
            t.end()
        }
    })
})


test.cb('partial views in views', t => {
    t.plan(1)
    app({
        partials: {
            a: {
                views: {
                    test: (state, actions, views) => data => {
                        views.b.test(data)
                    }
                },
                partials: {
                    b: {
                        views: {
                            test: _ => props => {
                                t.is(props, 'test data')
                            }
                        }
                    }
                }
            }
        },
        view: (state, actions, views) => {
            views.a.test('test data')
            t.end()
        }
    })
})