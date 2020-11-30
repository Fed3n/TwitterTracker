test('hello world', ()=>{
	expect(true).toBe(true);
})

test('mught fail', ()=>{
	expect(false).not.toBe(true);
})