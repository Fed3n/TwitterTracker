const twitter_api = require("../tweeter_api.js");

test('test stream closed', ()=>{
	expect(twitter_api.stream).toBeNull();
})