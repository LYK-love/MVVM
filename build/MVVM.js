"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleBindTwoWay = exports.simpleBindFunc = exports.MVVM = void 0;
//‘_bind_p_callback’属性，用于存储属性p的callback array
function BIND_EMITTER(p) {
    return '_bind_' + p + "_callbacks";
}
function BindFunc(tar, property, f) {
    let property_emit = BIND_EMITTER(property);
    if (tar.hasOwnProperty(property_emit)) {
    }
    else {
        //如果对象的property属性没有被设置过绑定，则（为该对象的该属性）设置绑定
        BindSetup(tar, property);
    }
    tar[property_emit].push(f);
}
function BindSetup(tar, property) {
    let property_emit = BIND_EMITTER(property);
    if (tar[property_emit] != null)
        return; //如果已经绑定了，则无需重复绑定.事实上这个逻辑不会为True
    tar[property_emit] = [];
    let emitter = tar[property_emit];
    let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(tar), property);
    if (descriptor != null && descriptor.set != null && descriptor.get != null) {
        var getter = descriptor.get;
        var setter = descriptor.set;
        Object.defineProperty(tar, property, {
            get: function () {
                alert("begin getter...");
                return getter.call(this);
            },
            set: function (v) {
                let curv = getter.call(this);
                if (curv != v) {
                    alert("begin setter..., new value is: " + v);
                    setter.call(this, v);
                    emitter.forEach(f => f(v));
                }
            }
        });
    }
    else {
        let val = tar[property];
        let property_bind = '_bind_' + property + '_p';
        tar[property_bind] = val; //新增一个property_bind属性，其值初始化为property属性的值
        Object.defineProperty(tar, property, {
            get: function () {
                return this[property_bind];
            },
            set: function (v) {
                let curv = this[property_bind];
                if (curv != v) {
                    this[property_bind] = v;
                    emitter.forEach(f => f(v));
                }
            }
        });
    }
}
/**
 * 确保Html元素类型是input或者textarea
 * @param element
 * @returns
 */
function checkBindElement(element) {
    const nodeName = element.nodeName && element.nodeName.toLowerCase();
    if (nodeName === 'input' || nodeName === 'textarea') {
        return true;
    }
    else {
        return false;
    }
}
class MVVM {
    constructor() {
        this.scope = {};
        //对所有的DOM节点尝试进行双向绑定：
        //选择所有设置了绑定语法的Dom元素, 筛选出合法的元素
        const validElements = this.getAllValidElements();
        //得到合法元素的不重复且合法的Key集合
        const keySet = this.getAllUniqueValidKeysToBindFromElements(validElements);
        //对于集合中每个Key，对它设置双向绑定，事件默认是input
        keySet.forEach(currentKey => {
            const listenEvents = ['input'];
            this.bindTwoWay(currentKey, listenEvents);
        });
    }
    /**
     * 单向绑定
     * 该函数是幂等的
     *
     * @param key
     * @param f 该函数一般通过bindOneWayWithValue()调用，此时前者会传回调函数f作为参数。 用户也可以单独调用该函数，
     * 此时如果不传f，则f赋值为默认的回调函数
     * @returns
     */
    bindOneWay(key, f = (v) => { alert("This is default setter callback!"); }) {
        if (!this.isValidKeyToBind(key))
            return; //如果该Key不合法，直接返回
        // if( this.checkKeyInScope(key) ) return; //如果该key已经被绑定过，则无需再次绑定
        const allMatchingValidElements = this.getAllMactchingValidElements(key); //得到所有匹配key的合法的Dom元素
        if (allMatchingValidElements.length === 0)
            return;
        //tmp
        // let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this.scope), key);
        // let getter = (descriptor as PropertyDescriptor).get;
        allMatchingValidElements.forEach(element => {
            BindFunc(element, key, f);
        });
        // Object.defineProperty(this.scope, key, {
        //   set: function (newValue) {
        //     allMatchingValidElements.forEach((element) => {
        //       if (checkBindElement(element)) {
        //         (element as HTMLInputElement).value = newValue
        //       } else {
        //         element.innerHTML = newValue
        //       }
        //     })
        //   },
        //   get: function () {
        //     return (getter as ()=> any).call(this);
        //   },
        //   enumerable: true
        // })
    }
    bindOneWayWithValue(key, value) {
        //这里的value是双向绑定时传入的（也就是input触发时），在当时是newValue，
        //但是当回调函数调用时，该值已经算是old value了。 setter的参数v才是new value
        this.bindOneWay(key, (v) => { console.log("callback!, old value is: " + value + "; new value is:" + v); });
        // this.scope[key] = value;
        // alert("new value shoube be: " + value );
        // alert("new value actually is: " + this.scope[key as keyof typeof this.scope] );
    }
    //
    /**
     * 选择出所有要进行双向绑定的Dom元素，将其对应的属性(key)和回调函数绑定到事件监听
     * 回调函数：这里选择最简单的做法，将“输出Dom元素的value的值”这个函数作为回调函数进行绑定
     * 注意： 每次事件发生，就会绑定一次。例如，如果input了三次，就会调用三次bindOneWay，绑定3个callback
     *
     * 比如,我绑定事件为input，key为deposit，则双向绑定会选择出所有拥有key为deposit的Dom节点，对这些节点添加input事件的监听， 并且修改这些节点的key属性的
     * getter和setter，使得事件触发时，节点能对其key属性做出对应的行为
     * @param listenEvents   对于双向绑定，要监听的Dom事件集合。 这里只有input
     * @param key
     */
    bindTwoWay(key, listenEvents = ['input']) {
        //checlKeyInScope?
        //得到所有合法的DOm节点，进一步筛选出其中要双向绑定的节点
        const allMactchingValidElements = this.getAllMactchingValidElements(key);
        allMactchingValidElements.forEach(element => {
            // listenEvents = ['input', 'click'];
            listenEvents.map(event => {
                //双向绑定： 事件监听+单向绑定
                //对每个element，为listenEvents中的每个事件添加事件监听。 
                //监听过程就是将用户输入的view值(view layer)输入到model，进行单向绑定
                element.addEventListener(event, (e) => {
                    console.log("Try to 2-Way-Bind: " + key);
                    //这里偷懒了，对于HTMLInputElement的element取value，对于其它类型的可能取别的属性
                    let newVal = element.value;
                    console.log("new value: " + newVal);
                    //这里的实现是： 每监听到一次事件，就绑定一次（绑定一个回调函数）。 因此如果input了三次，就会绑定3个callback
                    this.bindOneWayWithValue(key, newVal);
                    // if (this.checkKeyInScope(key)) {
                    //   console.log("Try to 2Bind: " + key);
                    //   this.bindOneWayWithValue(key,(element as HTMLInputElement).value)
                    // }
                });
            });
        });
    }
    /**
     * 确保对应名为key的property存在
     */
    checkKeyInScope(key) {
        // if (this.scope.hasOwnProperty(key)) {
        //   return true
        // } else {
        //   return false;
        return true;
        // }
    }
    /**
     * 判断要绑定的属性是否合法
     * 这里采用最简单的判断，正常指的是key不为空
     * @param key : 待绑定的属性，被绑定语法选择
     * @returns True if key正常
     */
    isValidKeyToBind(key) {
        //得到Dom节点的要绑定的property
        return key != null; ////可能存在data-bind = [null]的情况，此时返回False
    }
    /**
     * 不知道<a></a>的setter是什么
     * @param inputElement 用于div， span等元素
     * @param newValue
     */
    elementWithValueCallback(newValue) {
        console.log("setter!!");
        alert("haha");
    }
    elementWithInnerHtmlCallback(newValue) {
    }
    getElementCallback(element) {
        if (checkBindElement(element))
            return (newValue) => {
                element.value = newValue;
                alert("haha");
            };
        else
            return (newValue) => {
                element.innerHTML = newValue;
                alert("xixi");
            };
    }
    /**
     * 给定Dom节点集合，得到其中所有不重复且合法的待绑定Key
     * 合法：isValidKeyToBind()，即Key不为空
     * 待绑定Key： 即满足 data-bind=${key} 的key
     *  对于每个节点，只会选取其第一个待绑定key
     * @param elements Dom节点数组
     * @returns elements中所有的不重复且有效的Key的集合
     */
    getAllUniqueValidKeysToBindFromElements(elements) {
        let keySet = new Set();
        elements.forEach(element => {
            const currentKey = element.getAttribute('data-bind');
            if (!this.isValidKeyToBind(currentKey))
                return;
            const validCurrentKey = currentKey;
            if (!keySet.has(validCurrentKey))
                keySet.add(validCurrentKey);
        });
        return keySet;
    }
    getAllMactchingValidElements(key) {
        return this.filterMatchingElements(this.getAllValidElements(), key);
    }
    /**
     * 得到所有被绑定的Dom原色，并筛选出其中合法的元素。
     * 合法：即能通过checkBindElement()的判断。 注意到合法的element必定是HTMLElement
     * 底层调用的是filterValidElements（）
     * @param originElements
     * @returns 所有合法的Dom元素
     */
    getAllValidElements() {
        const allToBindElements = Array.from(document.querySelectorAll('[data-bind]'));
        const allValidElements = this.filterValidElements(allToBindElements);
        return allValidElements;
    }
    /**
     * 给定Dom元素列表和要查找的Key，筛选出列表中Key符合的子集
     * @param originElements
     * @param key
     * @returns
     */
    filterMatchingElements(originElements, key) {
        const allMatchingElements = Array.from(document.querySelectorAll(`[data-bind=${key}]`));
        const matchingElements = originElements.filter(element => {
            return element.getAttribute('data-bind') === key;
        });
        return matchingElements;
    }
    /**
     * 给定Dom元素列表，筛选出其中合法的子集
     * @param originElements
     * @returns 给定的Dom元素中合法的子集
     */
    filterValidElements(originElements) {
        const validElements = originElements.filter(element => {
            return checkBindElement(element);
        });
        return validElements;
    }
}
exports.MVVM = MVVM;
var mvvm = new MVVM();
/**
 * 简化版单向绑定
 * @param tar
 * @param property
 * @param f
 */
function simpleBindFunc(tar, property, f) {
    let property_emit = BIND_EMITTER(property);
    if (tar.hasOwnProperty(property_emit)) {
    }
    else {
        //如果对象的property属性没有被设置过绑定，则（为该对象的该属性）设置绑定
        simpleBindSetup(tar, property);
    }
    tar[property_emit].push(f);
}
exports.simpleBindFunc = simpleBindFunc;
function simpleBindSetup(tar, property) {
    let property_emit = BIND_EMITTER(property);
    if (tar[property_emit] != null)
        return; //如果已经绑定了，则无需重复绑定.事实上这个逻辑不会为True
    tar[property_emit] = [];
    let emitter = tar[property_emit];
    let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(tar), property);
    if (descriptor != null && descriptor.set != null && descriptor.get != null) {
        var getter = descriptor.get;
        var setter = descriptor.set;
        Object.defineProperty(tar, property, {
            get: function () {
                return getter.call(this);
            },
            set: function (v) {
                let curv = getter.call(this);
                if (curv != v) {
                    setter.call(this, v);
                    emitter.forEach(f => f(v));
                }
            }
        });
    }
    else {
        let val = tar[property];
        let property_bind = '_bind_' + property + '_p';
        tar[property_bind] = val; //新增一个property_bind属性，其值初始化为property属性的值
        Object.defineProperty(tar, property, {
            get: function () {
                return this[property_bind];
            },
            set: function (v) {
                let curv = this[property_bind];
                if (curv != v) {
                    this[property_bind] = v;
                    emitter.forEach(f => f(v));
                }
            }
        });
    }
}
/**
 * 简化版双向绑定
 * @param property
 * @param tar1
 * @param tar2
 */
function simpleBindTwoWay(property, tar1, tar2) {
    simpleBindFunc(tar1, property, (v) => tar2[property] = v);
    simpleBindFunc(tar2, property, (v) => tar1[property] = v);
}
exports.simpleBindTwoWay = simpleBindTwoWay;
