const Twitter = require('twitter-lite');

let app = new Twitter({
    bearer_token: 'AAAAAAAAAAAAAAAAAAAAAIfdIwEAAAAAO5RY%2FGsvF4lZlch0Wv%2Bf65NQc%2Bg%3DmFVfzJK1AHQbtvsP3khEEaJLhZxmloBcefCcN0FI49jz67lE1V' 
});

let auth = new Twitter({
    consumer_key: 'Wrtou6UjN3chR74gRRKUJL866',
    consumer_secret: 'kRF2kSJMhYvI5BLLI5rIaRsxnWsg8f2Ppnc5CU52uzCxJmqOnl'
});

module.exports = {

    recentSearch: async function(params){
        try{
            let res = await app.get('search/tweets', params);
            return res.statuses;
        }
        catch(err){
            console.log(err);
            return null;
        }
    }
}
