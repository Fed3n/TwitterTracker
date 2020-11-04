const express = require('express');
const bodyParser = require("body-parser");
const twitter_api = require('./twitter_api.js');
const fs = require('fs');
const https = require('https');

var app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.render("prova");
});

// app.get("/will", function (req, res) {
//     res.render("prova");
// });

// app.get("/marti", function (req, res) {
//     res.render("filtro");
// });

// async function getLocation(query){
//     return new Promise(function(resolve, reject){
//         const options = {
//             hostname: 'nominatim.openstreetmap.org',
//             port: 443,
//             path: '/search/' + query.replace(" ", "%20") + '?format=json&addressdetails=1&limit=1',
//             method: 'GET',
//             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36' }
//         }

//         const reqa = https.request(options, resa => {
//             resa.on('data', d => {
//                 var location = JSON.parse(d);
//                 resolve(location);
//             })
//         })

//         reqa.on('error', error => {
//             reject(error);
//         })

//         reqa.end()
//     })
// }

// app.post("/filter", async function (req, res) {
//     let rawData = fs.readFileSync(__dirname + '/search_dump.txt');
//     let tweetSet = JSON.parse(rawData);

//     let search = req.body;

//     let filteredSet = [];

//     if(search.param == "hashtag"){
//         tweetSet.forEach(tweet => {
//             tweet.data.entities.hashtags.forEach(tag => {
//                 if(tag.tag == search.value)
//                     filteredSet.push(tweet);
//             });
//         });
//     }
//     else if(search.param == "location"){

//         /* RICERCA PER COMUNI perchè non so se riesco a fare quello fatto bene per tempo
//         var place_id;
//         tweetSet.includes.places.forEach(place => {
//             if(place.name.replace(/[\W_]+/g,'').toLowerCase() == search.value.replace(/[\W_]+/g, '').toLowerCase()){
//                 place_id = place.id;
//             }
//         })

//         tweetSet.data.forEach(tweet => {
//             if(tweet.geo != undefined && tweet.geo.place_id == place_id){
//                 filteredSet.push(tweet);
//             }
//         });
//     } */
//    // '/search/' + search.value.replace(/\s/g, '') + '?format=json&addressdetails=1&limit=1' 'nominatim.openstreetmap.org'


//         // DOVREBBE ESSERE quello fatto bene
//         var place_ids = [];
//         var location = await getLocation(search.value);
//         var bbox = location[0].boundingbox;
//         bbox = bbox.map(function (x) { 
//             return parseFloat(x, 10); 
//           });
    
//         tweetSet.includes.places.forEach(place => {
//             let place_bbox = place.geo.bbox;
//             let coords = [
//                 (place_bbox[0]+place_bbox[2])/2,
//                 (place_bbox[1]+place_bbox[3])/2
//             ];
//             if(bbox[2] <= coords[0] && bbox[3] >= coords[0] && 
//                bbox[0] <= coords[1] && bbox[1] >= coords[1]){
//                    place_ids.push(place.id);
//                }
//         });

//         tweetSet.data.forEach(tweet => {
//             if(tweet.geo != undefined && place_ids.indexOf(tweet.geo.place_id) > -1){
//                 filteredSet.push(tweet);
//             }
//         });
//     }


//     res.header("Content-Type", 'application/json');
//     res.send(filteredSet);
// });

// //STREAMING REST API//
// app.post("/addRule", function (req, res) {
//     console.log(req.body);
//     let err = null;
//     for(let i = 0; i < req.body.length; i++){
//         (async() => {
//             err = await setFilter(req.body[i].tipo + ':' + req.body[i].valore, req.body[i].valore); //non sono sicuro si settino così i filtri ma whatever
//             if (err)
//                 res.status(500).send("errore nell'aggiunta di filtri");
//         })
//     }
//     res.send("flitri aggiunti");
// });

//Funzione provvisoria per far partire stream per will//Takes as req body {expr: query_expression}
app.post("/stream/start", async function(req,res){
    let expr = req.body.expr;
    if(expr){
        await twitter_api.removeAllRules();
        await twitter_api.setFilter(expr, "test");
        twitter_api.ruledStream();
        res.status(200).send("k");
    } else {
        twitter_api.stdStream();
        res.status(200).send("k");
    }
});

//Chiude tutti gli stream in corso
app.post("/stream/stop", async function(req, res){
    await twitter_api.closeStream();
    res.status(200).send("Stream closed");
});

//Provvisoria, ritorna tweet dello stream e svuota buffer
app.get("/stream", function(req, res){
    let arr = twitter_api.stream_array.slice();
    twitter_api.stream_array = [];
    res.setHeader('Content-Type', 'application/json');  
    return res.status(200).send(arr);
});
//###########################

//Tweets Search//Returns tweet array//Takes as query {expr: query_expression, lim: number_of_tweets}
app.get("/search", async function (req, res) {
    let expr = req.query.expr;
    console.log(req.query.lim);
    let lim = parseInt(req.query.lim);
    let arr = await twitter_api.recentSearch(expr,lim);
    console.log(arr);
    if(arr) {
        if(arr.length > 0){
            res.setHeader('Content-Type', 'application/json');  
            return res.status(200).send(arr);
        } 
        else return res.status(404).send("Nessun tweet corrisponde alla ricerca.");
    }
    else return res.status(500).send("Errore in search.");
});

app.listen(8000, () => {
    console.log(`app listening at http://localhost:8000`);
});
