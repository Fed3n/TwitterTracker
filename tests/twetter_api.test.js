const twitter_api = require("../tweeter_api.js");

test('test stream closed', ()=>{
	expect(twitter_api.stream).toBeNull();
});

test('test recent search error', async ()=>{
	expect(await twitter_api.recentSearch()).toBeNull();
});


test('test recent search', async ()=>{
	let params = {
		track:"ciao",
		follow:"",
		locations:""
	};
	let data = await twitter_api.recentSearch(params);

	expect(data).not.toBeNull();
});
