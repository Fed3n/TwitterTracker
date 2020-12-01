const rewire = require("rewire");
const notAModule = rewire("./testing.js");

test('test sample function', ()=>{
	const sum = notAModule.__get__("sum");
	expect(sum(4,3)).toBe(7);
})