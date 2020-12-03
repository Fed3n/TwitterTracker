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
            console.log(`watcher ${name}`);
            newapi.recentSearch(params).then((arr) => {
                for(el of arr){
                    let is_in = false;
                    //when a new tweet is added, new property becomes true as a notification
                    for(tw of watchers[name]["tweets"]){
                        if(el.id == tw.id){
                            is_in = true;
                            break;
                        }
                    }
                    if(!is_in){
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
            "timer": timer,
            "params": params
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
        for(let name in watchers)
            list.push({
                "name": name,
                "new": watchers[name]["new"]
            });
        return list;
    },

    getWatchersData: function(namelist){
        data = [];
        for(let name of namelist){
            if(name in watchers){
                //timer token is private and not to be used outside
                data.push({
                    "name": name,
                    "tweets": watchers[name]["tweets"],
                    "new": watchers[name]["new"],
                    "timer": watchers[name]["timer"],
                    "params": watchers[name]["params"]
                });
            }
        }
        return data;
    }
    
}
