const newapi = require('./tweeter_api.js');


var watchers = {};

module.exports = {

    //adds a watcher to the this.watchers object given a unique name, time interval and tweet search parameters
    addWatcher: function(name, timer, params){
        if(name in watchers) {
            console.log("Watcher name already in use");
            return -1;
        }
        //adds a new timed function and returns its token
        var token = setInterval(function (){
            newapi.recentSearch(params).then((arr) => {
                for(el of arr){
                    //when a new tweet is added, new property becomes true as a notification
                    if(!watchers[name]["tweets"].includes(el)){
                        watchers[name]["tweets"].push(el);
                        watchers[name]["new"] = true;
                    }
                }
            });
        }, timer);
        watchers[name] = {
            "token": token,
            "tweets": [],
            "new": false,
            "timer": timer
        };
        return 0;
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
        for(name of namelist){
            if(name in watchers){
                //timer token is private and not to be used outside
                data[name] = {
                    "tweets": watchers[name]["tweets"],
                    "new": watchers[name]["new"],
                    "timer": watchers[name]["timer"]
                }
            }
        }
        return data;
    }
    
}
