!function(r){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=r();else if("function"==typeof define&&define.amd)define([],r);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).partial=r()}}(function(){return function r(n,e,t){function i(u,f){if(!e[u]){if(!n[u]){var a="function"==typeof require&&require;if(!f&&a)return a(u,!0);if(o)return o(u,!0);var c=new Error("Cannot find module '"+u+"'");throw c.code="MODULE_NOT_FOUND",c}var l=e[u]={exports:{}};n[u][0].call(l.exports,function(r){var e=n[u][1][r];return i(e||r)},l,l.exports,r,n,e,t)}return e[u].exports}for(var o="function"==typeof require&&require,u=0;u<t.length;u++)i(t[u]);return i}({1:[function(r,n,e){"use strict";function t(r){if(Array.isArray(r)){for(var n=0,e=Array(r.length);n<r.length;n++)e[n]=r[n];return e}return Array.from(r)}function i(r,n,e){return n in r?Object.defineProperty(r,n,{value:e,enumerable:!0,configurable:!0,writable:!0}):r[n]=e,r}var o=function(){function r(r,n){var e=[],t=!0,i=!1,o=void 0;try{for(var u,f=r[Symbol.iterator]();!(t=(u=f.next()).done)&&(e.push(u.value),!n||e.length!==n);t=!0);}catch(r){i=!0,o=r}finally{try{!t&&f.return&&f.return()}finally{if(i)throw o}}return e}return function(n,e){if(Array.isArray(n))return n;if(Symbol.iterator in Object(n))return r(n,e);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),u=function(r,n,e){return function(t){return e(i({},r,Object.assign(n[r],t)))}},f=function(r,n){return function(e,t,i){return function(o){var f=n(e[r],t[r],i),a=u(r,e,o);return"function"==typeof f?f(a):a(f)}}},a=function r(n,e){var t={};for(var i in e)t[i]=("function"==typeof e[i]?f:r)(n,e[i]);return t},c=function(r,n){return function(e,t,i){return n(e[r],t[r],i)}},l=function(r,n){return function(e,t,i){for(var o=arguments.length,u=Array(o>3?o-3:0),f=3;f<o;f++)u[f-3]=arguments[f];return n.apply(void 0,[e[r],t[r],i[r]].concat(u))}},s=function(r){var n={};return{events:{render:function(r,e,t){return function(r,e){return t(r,e,n)}},"partial:render":function(r,e,i){var u=o(i,2),f=u[0],a=u[1];return f.apply(void 0,[r,e,n].concat(t(a)))},"partial:register":function(e,t,i){var u=o(i,3),f=u[0],a=u[1],c=u[2];n[f]=n[f]||{},n[f][a]=function(){for(var n=arguments.length,e=Array(n),t=0;t<n;t++)e[t]=arguments[t];return r("partial:render",[c,e])}}}}};s.mixin=function(r,n){return function(e){var t=n(e),o={state:i({},r,{}),actions:i({},r,{}),events:{}};o.state[r]=t.state||{},o.actions[r]=a(r,t.actions||{});for(var u in t.events||{})"function"==typeof t.events[u]?o.events[u]=c(r,t.events[u]):o.events[u]=t.events[u].map(function(n){return c(r,n)});for(var f in t.views||{})e("partial:register",[r,f,l(r,t.views[f])]);return o}},n.exports=s},{}]},{},[1])(1)});
