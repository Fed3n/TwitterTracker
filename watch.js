const newapi = require('./tweeter_api.js');


var watchers = {};

module.exports = {


    watcherSearch: function(name, params){
        newapi.recentSearch(params).then((arr) => {
            for(el of arr){
                let is_in = false;
                //when a new tweet is added, news property becomes true as a notification
                for(tw of watchers[name]["tweets"]){
                    if(el.id == tw.id){
                        is_in = true;
                        break;
                    }
                }
                if(!is_in){
                    watchers[name]["tweets"].push(el);
                    watchers[name]["news"] = true;
                }
            }
        });
    },

    //adds a watcher to the this.watchers object given a unique name, time interval and tweet search parameters
    addWatcher: function(name, timer, params){
        if(name in watchers) {
            console.log("Watcher name already in use");
            return -1;
        }
        //adds a new timed function and returns its token
        var token = setInterval(this.watcherSearch, timer, name, params);
        watchers[name] = {
            "token": token,
            "tweets": [],
            "news": false,
            "timer": timer,
            "params": params
        };
        this.watcherSearch(name, params);
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
                "news": watchers[name]["news"]
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
                    "news": watchers[name]["news"],
                    "timer": watchers[name]["timer"],
                    "params": watchers[name]["params"]
                });
                //not quite REST but w/e GET shouldn't change status
                watchers[name]["news"] = false;
            }
        }
        return data;
    }
    
}
