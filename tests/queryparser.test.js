const { TestScheduler } = require("jest");
const rewire = require("rewire");
const file = rewire("../public/queryparser.js");
const queryparser = file.__get__("queryparser");

test('test parseStreamQuery empty', ()=>{
	expect(queryparser.parseStreamQuery()).toBeNull();
})