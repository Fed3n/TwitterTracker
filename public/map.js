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
    SetMap : function(div){
        mymap = L.map(div).setView([0, 0], 1.5);
        const attribution ='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tiles = L.tileLayer(tileUrl, { attribution });
        tiles.addTo(mymap);
    },
    

    AddMap : function(div, tweets){
        map.SetMap(div);
        let nonJeolocated = 0;
        for(let i = 0;i < tweets.length; i++){
            if(tweets[i].geoLocation.latitude && tweets[i].geoLocation.longitude)
                map.AddMarker(tweets[i].geoLocation.latitude, tweets[i].geoLocation.longitude,  tweets[i].text);
            else{
                nonJeolocated ++;
            }
        }
        if(nonJeolocated > 0)
            alert(nonJeolocated + " tweets non inseriti per mancanza di dati");
    },
    
    AddMarker : function(lat, long, tweet){
        let new_Marker = L.marker([lat, long]/* , {icon: myIcon} */).addTo(mymap);
        new_Marker.message = tweet;
        new_Marker.on('click', function(e){
            if(e.sourceTarget.getPopup())    
                e.sourceTarget.getPopup().openPopup();
            else
                e.sourceTarget.bindPopup(e.sourceTarget.message).openPopup();

        });
        map.marker.push(new_Marker);
    },

    DeleteAllMarkers : function () {
        for(i=0;i<map.marker.length;i++) {
            mymap.removeLayer(map.marker[i]);
        }  
    }
};