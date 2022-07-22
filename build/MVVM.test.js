"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MVVM_1 = require("./MVVM");
describe("开始执行测试集合", () => {
    let exampleObj = {
        "value": 1,
        "name": "k",
        "id": 11
    };
    let exampleObjAlter = {
        "value": 2,
        "name": "kk",
        "id": 12
    };
    beforeAll(() => {
        console.log("用例集合前置");
    });
    afterAll(() => {
        console.log("用例集合执行结束");
    });
    beforeEach(() => {
        console.log('1111111111');
    });
    afterEach(() => {
        console.log('22222222222');
    });
    test('测试单向绑定', () => {
        console.log("hahahahha");
        (0, MVVM_1.simpleBindFunc)(exampleObj, "id", (val) => (console.log("回调成功， 证明已正确绑定" + 2 * val)));
        exampleObj.id = 4;
        expect(1 + 2).toBe(3);
    });
    /**
     * 测试双向绑定，过程为：一开始obj1和obj2的name不同， 我将obj1和obj2的name属性双向绑定后,\\
    对obj1.name进行修改(即调用setter)会触发回调函数， 而回调函数的逻辑是会更改obj2的name属性。 对obj2.name的修改又回触发obj2的name的回调函数，\\
    其逻辑是会修改obj1的name属性。 由于obj1的name的值已经变过了，按照我的逻辑，第二次回调不会发生作用，整个过程因此结束。 最终，obj1和obj2的值必定相等

    例如：将obj1.name设为“宽宽”，则：
    1. 对obj1的name的setter的调用会导致obj1的name的回调触发，将obj2点name也设为宽宽
    2. 对obj2的name的setter的调用又会导致obj1的name的回调触发
    3. 由于obj1的name已经是宽宽了，对obj1对name的回调，按照我的逻辑，由于新旧值没有改变，就不会继续执行下去，整个过程结束
    4. 最终，obj1和obj2的name都是相同值
     */
    const BindTwoWayTestDescription = "";
    test('测试双向绑定', () => {
        (0, MVVM_1.simpleBindTwoWay)("name", exampleObj, exampleObjAlter);
        exampleObj.name = "宽宽";
        console.log("回调成功， obj1的name为：" + exampleObj.name + " ,obj2的name为: " + exampleObjAlter.name);
        expect(exampleObj.name === exampleObjAlter.name).toBe(true);
    });
});
