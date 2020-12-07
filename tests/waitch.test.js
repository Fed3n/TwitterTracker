const watch = require("../watch.js");

test('test watches empty', ()=>{
	expect(watch.listWatchers().length).toBe(0);
})