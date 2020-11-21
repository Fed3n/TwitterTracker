const queryparser = {
   
    //stream queries usano track,follow,location
    //il parser semplifica l'uso
    //follow richiede ID -> utente inserisce username
    //location richiede boundingbox -> utente inserisce luoghi
    parseStreamQuery: function(track, follow, location){
        let params = {};
        if(track) params["track"] = track;
        if(follow) {
                let queries = '';
                for(name of follow.split(',')){
                        console.log(`looking for ${name}`);
                        let user = await $.get(`/user?screen_name=${name}`);
                        console.log(`response is ${user.id}`);
                        queries += `${user.id},`;
                }
                console.log(queries);
                params["follow"] = queries.slice(0,queries.length-1);
        }
        //per ogni citta' nella query sostituisco il boundingbox
        if(location) {
                let queries = '';
                for(loc of location.split(',')){
                        let geoloc = await geoutils.getCoordsFromLoc(loc);
                        let box = geoloc.box; 
                        if(box){
                                queries += `${box.sw.lon},${box.sw.lat},${box.ne.lon},${box.ne.lat},`;
                        }
                }
                params["locations"] = queries.slice(0,queries.length-1);
        }
        
        //Se ho abbastanza parametri ritorno l'oggetto, senno' null
        if(Object.keys(params).length) return params;
        else return null;
        
    },
    
    //per ora unica cosa da parsare nella search e' la location 
    parseSearchQuery: function(q, geo, lan, count){
        let params = {};
        params["q"] = q;
        if(geo) {
                let geoloc = await geoutils.getCoordsFromLoc(geo);
                let coords = geoloc.coords;
                let boxrad = geoloc.radius;
                //per ora 1mile ma dovrebbe essere settabile ~~
                params["geocode"] = `${coords.lat},${coords.lon},${boxrad}km`;
        }
        if(lan) params["lang"] = lan;
        if(count) params["count"] = count;
        
        if(Object.keys(params).length){
            return params;
        }
        else return null;

    }

}
