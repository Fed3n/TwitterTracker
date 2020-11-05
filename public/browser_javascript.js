var numeroFiltri = 0;

var markers = [{lat:0,long:0}, {lat:100,long:100}, {lat:500,long:200}];
var i = 0;


$(document).ready(function(){
    
    Add_Filter();
    map.SetMap();

    $("#aggiungi").click(function(ev){
        ev.preventDefault();
        Add_Filter();
        map.DeleteAllMarkers();
    });

    $("#aggiungi_FIltri").click( function(ev){
        ev.preventDefault();
        let data =[];
        for(let i = 1; i <= numeroFiltri; i++){
            data.push({tipo : $("#tipo_Filtro_"+i).val(), valore : $("#testo_Filtro_"+i).val()});
        }
        /*
        TUTTO INUTILE ED ODIO TWITTER
        $.ajax({
            type: "POST",
            url: "https://api.twitter.com/2/tweets/search/stream/rules",
            dataType: 'json',
            contentType: 'application/json',
            processData: false,
            data: '{"add":[{"value":str}]}',
            crossDomain:true,
            headers: {
                "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAAHLBIQEAAAAA6rcaCo2i4YR0AZRWaCK90hHR1nk%3D0z9Mc0w7NWc7AnLwWr7YzC0GXtNt75KNTfiLAJQpjXpHMjhxyJ",
                "Access-Control-Allow-Origin": "https://api.twitter.com",
                "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token"
            },
            success: function(){console.log("filtri aggiunti")},
          });*/
          $.ajax({
            type: "GET",
            url: "http://localhost:8000/c",
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(res){
                console.log("done")
                var data = res;
            },
            error: function(error){
                console.log(error);
            }
          });

    });

    $("#cerca").click( function(ev){
        ev.preventDefault();
        //alert("work in progress")
        map.AddMarker(markers[i].lat, markers[i].long, "marker n:" + i);
        i++;
    });
});

function Add_Filter(){
    let filtro = $("#Filtro").html();

    numeroFiltri++;
    filtro = filtro.replace("$IDTYPE","tipo_Filtro_"+numeroFiltri).replace("$IDTYPE","tipo_Filtro_"+numeroFiltri);
    filtro = filtro.replace("$IDFILTRO","testo_Filtro_"+numeroFiltri).replace("$IDFILTRO","testo_Filtro_"+numeroFiltri);

    $("#filtri").append(filtro);
}