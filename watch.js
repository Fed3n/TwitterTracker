const newapi = require('./tweeter_api.js');

watchers = {}

module.exports = {

    //adds a watcher to the watchers object given a unique name, time interval and tweet search parameters
    addWatcher: function(name, timer, params){
        if(name in watchers) {
            console.log("Watcher name already in use");
            return -1;
        }
        try {
            //adds a new timed function and return its token
            let token = setInterval(async function (params,name){
                let arr = await newapi.recentSearch(params)
                for(el of arr){
                    //when a new tweet is added, new property becomes true as a notification
                    if(!watchers[name]["tweets"].includes(el)){
                        watchers[name]["tweets"].push(el);
                        watchers[name]["new"] = true;
                        console.log(el);
                    }
                }
            }, timer);

            watchers[name] = {
                "token": token,
                "tweets": [],
                "new": false,
                "timer": timer
            }
            return 0;
        } catch (err) {
            console.log("Something went wrong");
            return -1;
        }
    },

    removeWatcher: function(name){
        if(name in watchers){
            //stops timed function via its token
            clearInterval(watchers[name]["token"]);
            delete watchers[name];
        }
    },

    listWatchers: function(){
        list = [];
        for(name in watchers)
            list.push(name);
        return list;
    },

    getWatchersData: function(namelist){
        data = {};
        for(name in namelist){
            if(name in watchers){
                //timer token is private and not to be used outside
                data[name] = {
                    "tweets": watchers[name]["tweets"],
                    "new": watchers[name]["new"],
                    "timer": watchers[name]["timer"]
                }
            }
        }
    }
    
}
