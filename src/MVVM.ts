//TODO 不知道如何把HTMLElement类型加上一个类型签名，只能将就一下
interface ElementType extends HTMLElement{
  [property:string]: any
}



//‘_bind_p_callback’属性，用于存储属性p的callback array
function BIND_EMITTER(p:string):string{
    return '_bind_' + p + "_callbacks";
}


function BindFunc(tar:ElementType,property:string,f:(v:any)=>void){

  let property_emit:string = BIND_EMITTER(property);
  if(tar.hasOwnProperty(property_emit)){
  }
  else{
    //如果对象的property属性没有被设置过绑定，则（为该对象的该属性）设置绑定
    BindSetup(tar,property);
  }

  (tar[property_emit] as Array<Function>).push(f);

}

function BindSetup(tar:ElementType, property: string) {
  
    let property_emit:string = BIND_EMITTER(property);
    if(tar[property_emit] != null) return; //如果已经绑定了，则无需重复绑定.事实上这个逻辑不会为True
    tar[property_emit] = [];

    let emitter: Array<Function> = (tar[property_emit] as Array<Function>);
    let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(tar), property);
    if (descriptor != null && descriptor.set != null && descriptor.get != null) {
        var getter = descriptor.get;
        var setter = descriptor.set;
        Object.defineProperty(tar, property, {
            get: function () {
              alert("begin getter..." );

                return getter.call(this);
            },
            set: function (v: any) {
                let curv = getter.call(this);
                if(curv != v){
                    alert("begin setter..., new value is: " + v );

                    setter.call(this, v);
                    emitter.forEach(f => f(v));
                }
            }
        })
    }
    else {
        let val = tar[property];
        let property_bind = '_bind_' + property+'_p';
        tar[property_bind] = val;//新增一个property_bind属性，其值初始化为property属性的值

        Object.defineProperty(tar, property, {
            get: function () {
                return this[property_bind];
            },
            set: function (v: any) {
                let curv = this[property_bind];
                if(curv != v){
                    this[property_bind] = v;
                    emitter.forEach(f => f(v));
                }
            }
        })
    }
}


/**
 * 确保Html元素类型是input或者textarea
 * @param element 
 * @returns 
 */
function checkBindElement(element: Element) {
    const nodeName = element.nodeName && element.nodeName.toLowerCase();
    if (nodeName === 'input' || nodeName === 'textarea') {
      return true
    } else {
      return false
    }
  }


interface ScopeType {
  [key:string]: any
}

class MVVM {
  scope:ScopeType;

  constructor() {

    this.scope = {}

    //对所有的DOM节点尝试进行双向绑定：

    //选择所有设置了绑定语法的Dom元素, 筛选出合法的元素
    const validElements = this.getAllValidElements();

    //得到合法元素的不重复且合法的Key集合
    const keySet = this.getAllUniqueValidKeysToBindFromElements(validElements);

    //对于集合中每个Key，对它设置双向绑定，事件默认是input
    keySet.forEach( currentKey =>{
      const listenEvents = ['input'];
      this.bindTwoWay( currentKey, listenEvents);
      }
    )

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
  bindOneWay(key: string, f: (v:any) => void = (v:any) => { alert("This is default setter callback!")} ) {
    if( !this.isValidKeyToBind(key)  ) return; //如果该Key不合法，直接返回
    // if( this.checkKeyInScope(key) ) return; //如果该key已经被绑定过，则无需再次绑定

    const allMatchingValidElements = this.getAllMactchingValidElements(key);//得到所有匹配key的合法的Dom元素
    if( allMatchingValidElements.length === 0 ) return;

    //tmp
    // let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this.scope), key);
    // let getter = (descriptor as PropertyDescriptor).get;

    allMatchingValidElements.forEach( element=>{
      BindFunc(element,key,f );
    })
    
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

  bindOneWayWithValue(key: string, value:string | number) {
      //这里的value是双向绑定时传入的（也就是input触发时），在当时是newValue，
      //但是当回调函数调用时，该值已经算是old value了。 setter的参数v才是new value
      this.bindOneWay(key, (v:any)=> {console.log("callback!, old value is: " + value + "; new value is:" + v )} )
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
  bindTwoWay( key:string, listenEvents:Array<string> = ['input'] ):void{
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
            let newVal = (element as HTMLInputElement).value;
            console.log("new value: " + newVal );

            //这里的实现是： 每监听到一次事件，就绑定一次（绑定一个回调函数）。 因此如果input了三次，就会绑定3个callback
            this.bindOneWayWithValue(key,newVal);
          // if (this.checkKeyInScope(key)) {
          //   console.log("Try to 2Bind: " + key);
          //   this.bindOneWayWithValue(key,(element as HTMLInputElement).value)
          // }
        })
      })
    })



  }


  /**
   * 确保对应名为key的property存在
   */
  private checkKeyInScope(key:string): Boolean{
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
  private isValidKeyToBind( key:string | null ):Boolean{
     //得到Dom节点的要绑定的property
     return key != null ////可能存在data-bind = [null]的情况，此时返回False
  }

  /**
   * 不知道<a></a>的setter是什么
   * @param inputElement 用于div， span等元素
   * @param newValue 
   */
  private elementWithValueCallback( newValue:any):void{
      console.log("setter!!")
      alert("haha")
  }

  private elementWithInnerHtmlCallback( newValue: string):void{

  }

  private getElementCallback(element:HTMLElement){
    if( checkBindElement(element) )
      return (newValue:string) => {
        (element as HTMLInputElement).value = newValue;
        alert("haha")

      }
    else
      return (newValue:string) => {
        (element as HTMLInputElement).innerHTML = newValue;
        alert("xixi")

      }
  }

  /**
   * 给定Dom节点集合，得到其中所有不重复且合法的待绑定Key
   * 合法：isValidKeyToBind()，即Key不为空
   * 待绑定Key： 即满足 data-bind=${key} 的key
   *  对于每个节点，只会选取其第一个待绑定key
   * @param elements Dom节点数组
   * @returns elements中所有的不重复且有效的Key的集合
   */
  private getAllUniqueValidKeysToBindFromElements(elements:Array<HTMLElement>):Set<string>{
    let keySet:Set<string> = new Set();

    elements.forEach(element => {
      const currentKey = element.getAttribute('data-bind');
      if( !this.isValidKeyToBind(currentKey)) return;

      const validCurrentKey:string = currentKey as string;
      if( !keySet.has(validCurrentKey) ) keySet.add(validCurrentKey);     
    })
    return keySet;

  }

  private getAllMactchingValidElements(key:string): Array<HTMLElement>{
    return this.filterMatchingElements( this.getAllValidElements(), key );
  }

  /**
   * 得到所有被绑定的Dom原色，并筛选出其中合法的元素。 
   * 合法：即能通过checkBindElement()的判断。 注意到合法的element必定是HTMLElement
   * 底层调用的是filterValidElements（）
   * @param originElements 
   * @returns 所有合法的Dom元素
   */
  private getAllValidElements( ): Array<HTMLElement>{
    const allToBindElements = Array.from( document.querySelectorAll('[data-bind]') as NodeListOf<HTMLElement>);
    const allValidElements = this.filterValidElements(allToBindElements);
    return allValidElements;

  }

  /**
   * 给定Dom元素列表和要查找的Key，筛选出列表中Key符合的子集
   * @param originElements 
   * @param key 
   * @returns 
   */
  private filterMatchingElements( originElements:Array<HTMLElement>, key:string ): Array<HTMLElement>{
    const allMatchingElements = Array.from(document.querySelectorAll(`[data-bind=${key}]`) as NodeListOf<HTMLElement>);
    const matchingElements = originElements.filter( element =>{
      return element.getAttribute('data-bind') === key;
    })
    return matchingElements;

  }

  /**
   * 给定Dom元素列表，筛选出其中合法的子集
   * @param originElements 
   * @returns 给定的Dom元素中合法的子集
   */
  private filterValidElements( originElements:Array<HTMLElement> ): Array<HTMLElement>{
    const validElements = originElements.filter( element=>{
      return checkBindElement(element);
    } )
    return validElements;
  }
}
  
  var mvvm = new MVVM()

  // mvvm.bindOneWay("input");
  // var x = document.querySelectorAll("[data-bind=value]")[0];
  // x.value = 1;

/************************************************************************** 
* 简化版的单向和双向绑定，用于Jest测试.
  简化版的单向和双向绑定，其逻辑和真正的单向/双向绑定是一样的，因此可以用来作为替代来测试
  之所以用简化版，是因为我的MVVM测试需要浏览器环境，而能够模拟浏览器环境的工具我只找到了jsdom， 它
  只支持commonJS，我不知道如何用ES6来引入jsdom。 因此没法采用浏览器环境测试，因此原有的单/双向绑定
  api无法测试，包括MVVM类也无法测试。
  不过，如前所述，单双向绑定的核心逻辑都包括在了简化版中，因此用来测试也足够了
  哈哈
*************************************************************************** */
interface simpleElementType{
  [property:string]: any
}

/**
 * 简化版单向绑定
 * @param tar 
 * @param property 
 * @param f 
 */
function simpleBindFunc(tar:simpleElementType,property:string,f:(v:any)=>void){

  let property_emit:string = BIND_EMITTER(property);
  if(tar.hasOwnProperty(property_emit)){
  }
  else{
    //如果对象的property属性没有被设置过绑定，则（为该对象的该属性）设置绑定
    simpleBindSetup(tar,property);
  }

  (tar[property_emit] as Array<Function>).push(f);

}



function simpleBindSetup(tar:simpleElementType, property: string) {
  
    let property_emit:string = BIND_EMITTER(property);
    if(tar[property_emit] != null) return; //如果已经绑定了，则无需重复绑定.事实上这个逻辑不会为True
    tar[property_emit] = [];

    let emitter: Array<Function> = (tar[property_emit] as Array<Function>);
    let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(tar), property);
    if (descriptor != null && descriptor.set != null && descriptor.get != null) {
        var getter = descriptor.get;
        var setter = descriptor.set;
        Object.defineProperty(tar, property, {
            get: function () {
                return getter.call(this);
            },
            set: function (v: any) {
                let curv = getter.call(this);
                if(curv != v){
                    setter.call(this, v);
                    emitter.forEach(f => f(v));
                }
            }
        })
    }
    else {
        let val = tar[property];
        let property_bind = '_bind_' + property+'_p';
        tar[property_bind] = val;//新增一个property_bind属性，其值初始化为property属性的值

        Object.defineProperty(tar, property, {
            get: function () {
                return this[property_bind];
            },
            set: function (v: any) {
                let curv = this[property_bind];
                if(curv != v){
                    this[property_bind] = v;
                    emitter.forEach(f => f(v));
                }
            }
        })
    }
}

/**
 * 简化版双向绑定
 * @param property 
 * @param tar1 
 * @param tar2 
 */
function simpleBindTwoWay(property:string,tar1:simpleElementType,tar2:simpleElementType){
  simpleBindFunc(tar1,property,(v)=>tar2[property] =v);
  simpleBindFunc(tar2,property,(v)=>tar1[property] =v);
}

/************************************************* */



export{
  MVVM, simpleBindFunc, simpleBindTwoWay
}
 
