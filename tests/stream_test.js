//RUN WITH NODE AFTER CHANGING TEST PARAMETERS
//TEST WILL GATHER REAL TIME RULED TWEETS FOR 5 SECONDS AND THEN SAMPLED TWEETS FOR 5 MORE SECONDS
//RESULTS ARE THEN PRINTED IN OUTPUT FILE

const twitter_api = require('../twitter_api.js')

//expression, tag format
const rule1 = ['#BLM','black lives matter'];
const rule2 = ['to:realdonaldtrump covid','tweets to trump about covid'];
const rule3 = ['',''];

(async() => {
    await twitter_api.removeAllRules();
    await twitter_api.setFilter(rule1[0], rule1[1]);
    await twitter_api.setFilter(rule2[0], rule2[1]);
    await twitter_api.setFilter(rule3[0], rule3[1]);
    twitter_api.ruledStream();
    setTimeout(function() {
       twitter_api.closeStream();
    }, 5000);
    await twitter_api.removeAllRules();
    twitter_api.stdStream();
    await setTimeout(function() {
       twitter_api.closeStream();
    }, 5000);
    twitter_api.saveStreamToJson();
})();
