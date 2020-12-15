/*
questo serve nel caso si voglia una icona personalizzata, la tengo che sai mai 
############################ 
var myIcon = L.icon({ 
    iconUrl:'icon.png',
    iconSize:[38,94],
    iconAnchor:[19,47]
});
############################
*/

/*
info utili: serve una dimensione minima se no si arrabbia e non compare nulla, così va
        #mappa {
        width: 49vw;
        height: 49vw;
        }

queste cose sono da includere 

        <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css"
        integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA=="
        crossorigin=""
        />
        <link  rel="stylesheet" type="text/css" href="style.css">
        <script
        src="https://unpkg.com/leaflet@1.4.0/dist/leaflet.js"
        integrity="sha512-QVftwZFqvtRNi0ZyCtsznlKSWOStnDORoefr1enyq5mVL4tmKB3S/EnC3rRJcxCPavG10IcrVGSmPh6Qw5lwrg=="
        crossorigin=""
        ></script>

*/

const map = {
    marker: [],
    circleMarker: [], 
    mymap: null,
    lastLat: null,
    lastLong:null,
    nonLocated:0,
    mostCommonPlace: null,
    SetMap : function(div){
        this.mymap = L.map(div).setView([41.2925, 12.5736], 5); //inizializza la mappa 
        const attribution ='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tiles = L.tileLayer(tileUrl, { attribution });
        tiles.addTo(this.mymap);
        this.mymap.on('click', function(e) { //alla pressione vengono salvati i dati di latitudine e longitudine 
            lastLat = e.latlng.lat;
            lastLong = e.latlng.lng;
        });
    },
    

    // AddMap : function(div, tweets){
    //     if(map.mymap){ //se la mappa è già stata inizializzata una volta la elimina e riconfigura
    //         map.DeleteAllMarkers();
    //         map.mymap.off();
    //         map.mymap.remove();
    //         map.mymap = null;
    //     }
    //     map.SetMap(div);
    //     let nonGeolocated = 0; 
    //     for(let i = 0;i < tweets.length; i++){ //aggiungiungo un marker per ogni tweet passato (se ha il campo geolacation settato)
    //         if(tweets[i].geo){
    //             if(tweets[i].entities.media != null){
    //                 map.AddMarker(tweets[i].geo.coordinates[0], tweets[i].geo.coordinates[1],  tweets[i].text, tweets[i].entities.media);
    //             }else{
    //                 map.AddMarker(tweets[i].geo.coordinates[0], tweets[i].geo.coordinates[1],  tweets[i].text, null);
    //             }
    //         }else{ 
    //             nonGeolocated ++;
    //         }
    //     }
    //     if(nonGeolocated > 0 && tweets.length > 1) //se ci sono tweet non geolocati stampo quanti sono con un allert
    //         alert(nonGeolocated + " tweets non inseriti per mancanza di dati");
    // },
    
    AddMarker : function(lat, long, tweet, img){ //aggiunge un singolo marker
        let new_Marker = L.marker([lat, long]/* , {icon: myIcon} */).addTo(this.mymap);
        new_Marker.message = tweet; 
        new_Marker.img = img; 
        new_Marker.on('click', function(e){ //aggiungo l'evento click che apre un popup al marker
            if(e.sourceTarget.getPopup())    
                e.sourceTarget.getPopup().openPopup();
            else{
                let message;
                message = "<p>" + e.sourceTarget.message +"</p>";
                if(new_Marker.img){
                    message += `<p><button Onclick = '$(".img").toggle()'>Show Image</button>`;
                    for(let i = 0; i < e.sourceTarget.img.length; i++){
                        message += `<image class = "img" style = "display: none;" height="150" src= "` + e.sourceTarget.img[i] + `"></p>`;
                    }
                }
                e.sourceTarget.bindPopup(message).openPopup();
            }

        });
        map.marker.push(new_Marker); //aggiungo il marker all'array dei marker 
    },

    DeleteAllMarkers : function () { //rimuove tutti i marker
        for(marker of this.marker) {
            this.mymap.removeLayer(marker);
        }  
    },

    DeleteAllCircleMarkers : function(){
        for(CircleMarker of this.circleMarker){
            CircleMarker.remove();
        }
    },

    AddCircleMarker: function(tweets){
        let dict = {};
        map.nonLocated = 0;
        for(let i = 0; i < tweets.length; i++){
            let coord = map.GetMediumLocationFromPlace(tweets[i]);
            if(coord && dict[Math.round(coord[0]) + "" + Math.round(coord[1])]){
                dict[Math.round(coord[0]) + "" + Math.round(coord[1])].radius += 1;
            }else if(coord){
                dict[Math.round(coord[0]) + "" + Math.round(coord[1])] = {
                    coord : coord,
                    radius : 1
                }
            }else{
                map.nonLocated++;
            }
        }
        let keys = Object.keys(dict);
        let mostCommon = 0
        for(let i = 0; i < keys.length; i ++){
            if(dict[keys[i]].radius > dict[keys[mostCommon]].radius){
                mostCommon = i;
            }
            this.circleMarker.push(map.CreateCircleMarker(dict[keys[i]].coord[1], dict[keys[i]].coord[0], dict[keys[i]].radius / (tweets.length - this.nonLocated) * 150));
        }
        this.mostCommonPlace = dict[keys[mostCommon]].coord;

    },

    CreateCircleMarker: function(lat, long, radius){
        console.log(radius)
        let mark = L.circleMarker([lat, long], {
            "radius": radius,
            "fillColor": "#ff7800",
            "color": "#ff7800",
            "weight": 1,
            "opacity": 1
          }).addTo(this.mymap);
        console.log(mark);
        return mark;
    },
    
    //richiesta ad openstreetmap API di location, coords rida' coordinate (lat,lon), box rida' boundingbox
    getCoordsFromLoc : async function(location,type) {
        let url = "http://nominatim.openstreetmap.org/search?";
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }
        try {
            let data = await $.get(url+$.param(params));
            console.log(data);
            if(type == "coords"){
                return {"lat": data[0].lat, "lon": data[0].lon};
            }
            if(type == "box"){
                //south Latitude, north Latitude, west Longitude, east Longitude
                return {"0":data[0].boundingbox["0"],"1":data[0].boundingbox["1"],"2":data[0].boundingbox["2"],"3":data[0].boundingbox["3"]};
            }
            return null;
        } catch(err) {
            console.log(err);
            return null;
        }
    },

    GetMediumLocationFromPlace(tweet){
        if(tweet.place != null){
            return [(tweet.place.bounding_box.coordinates[0][0][0] + tweet.place.bounding_box.coordinates[0][1][0] + 
                tweet.place.bounding_box.coordinates[0][2][0] + tweet.place.bounding_box.coordinates[0][3][0]) / 4 , 
            (tweet.place.bounding_box.coordinates[0][0][1] + tweet.place.bounding_box.coordinates[0][1][1] + 
                tweet.place.bounding_box.coordinates[0][2][1] + tweet.place.bounding_box.coordinates[0][3][1]) / 4 ];
        }
        return null;
    }
};
