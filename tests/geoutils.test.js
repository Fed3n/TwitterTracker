const { TestScheduler } = require("jest");
const rewire = require("rewire");
const file = rewire("../public/geoutils.js");
const geoutils = file.__get__("geoutils");

test('test deg2rad', ()=>{
	expect(geoutils.deg2rad(180)).toBeCloseTo(Math.PI, 2);
})