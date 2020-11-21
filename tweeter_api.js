const Twitter = require('twitter-lite');
require('dotenv').config();

const BEARER_TOKEN = process.env.BEARER_TOKEN;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const app = new Twitter({
    bearer_token: BEARER_TOKEN
});

const usr = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET
});

module.exports = {

    stream: null,
    stream_arr: [],

    recentSearch: async function(params){
        try{
            let res = await app.get('search/tweets', params);
            return res.statuses;
        }
        catch(err){
            console.log(err);
            return null;
        }
    },

    startStream: async function(params){
        this.stream = usr.stream("statuses/filter", params)
            .on("start", response => console.log("start"))
            .on("data", tweet => {
                console.log(tweet);
                this.stream_arr.push(tweet);
          })
            .on("error", error => console.log("error", error))
            .on("end", response => console.log("end"));
    },

    closeStream: async function(){
        this.stream.destroy();
    },

    getUser: async function(query){
        try {
            let res = await app.get('users/show', query);
            console.log(res);
            return res;
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }
}
