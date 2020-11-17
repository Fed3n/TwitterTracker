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

var map = {
    marker: [], 
    mymap: null,
    lastLat: null,
    lastLong:null,
    SetMap : function(div){
        mymap = L.map(div).setView([0, 0], 1.5); //inizializza la mappa 
        const attribution ='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tiles = L.tileLayer(tileUrl, { attribution });
        tiles.addTo(mymap);
        mymap.on('click', function(e) { //alla pressione vengono salvati i dati di latitudine e longitudine 
            alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
            lastLat = e.latlng.lat;
            lastLong = e.latlng.lng;
        });
    },
    

    AddMap : function(div, tweets){
        if(map.mymap){ //se la mappa è già stata inizializzata una volta la elimina e riconfigura
            map.DeleteAllMarkers();
            map.mymap.off();
            map.mymap.remove();
        }
        map.SetMap(div);
        let nonGeolocated = 0; 
        for(let i = 0;i < tweets.length; i++){ //aggiungiungo un marker per ogni tweet passato (se ha il campo geolacation settato)
            if(tweets[i].geoLocation.latitude && tweets[i].geoLocation.longitude){
                if(tweets[i].entities.media != null){
                    map.AddMarker(tweets[i].geoLocation.latitude, tweets[i].geoLocation.longitude,  tweets[i].text, tweets[i].entities.media);
                }else{
                    map.AddMarker(tweets[i].geoLocation.latitude, tweets[i].geoLocation.longitude,  tweets[i].text, null);
                }
            }else{ 
                nonGeolocated ++;
            }
        }
        if(nonJeolocated > 0) //se ci sono tweet non geolocati stampo quanti sono con un allert
            alert(nonGeolocated + " tweets non inseriti per mancanza di dati");
    },
    
    AddMarker : function(lat, long, tweet, img){ //aggiunge un singolo marker
        let new_Marker = L.marker([lat, long]/* , {icon: myIcon} */).addTo(mymap);
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
                        message += `<image class = "img" style = "display: none;" src= "` + e.sourceTarget.img[i].media_url + `"></p>`;
                    }
                }
                e.sourceTarget.bindPopup(message).openPopup();
            }

        });
        map.marker.push(new_Marker); //aggiungo il marker all'array dei marker 
    },

    DeleteAllMarkers : function () { //rimuove tutti i marker
        for(i=0;i<map.marker.length;i++) {
            mymap.removeLayer(map.marker[i]);
        }  
    }
};