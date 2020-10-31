const express = require('express');
const bodyParser = require("body-parser");
const twitter_Api = require('./twitter_api.js');
const fs = require('fs');
const https = require('https');

var app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/will", function (req, res) {
    res.render("prova");
});

app.get("/marti", function (req, res) {
    res.render("filtro");
});

app.post("/filter", function (req, res) {
    console.log(req.body);
    let rawData = fs.readFileSync(__dirname + '/search_dump.txt');
    let tweetSet = JSON.parse(rawData);

    let search = req.body;

    let filteredSet = [];

    if(search.param == "hashtag"){
        tweetSet.forEach(tweet => {
            tweet.data.entities.hashtags.forEach(tag => {
                if(tag.tag == search.value)
                    filteredSet.push(tweet);
            });
        });
    }
    else if(search.param == "location"){

        // RICERCA PER COMUNI perchè non so se riesco a fare quello fatto bene per tempo
        var place_id;
        tweetSet.includes.places.forEach(place => {
            if(place.name.replace(/[\W_]+/g,'').toLowerCase() == search.value.replace(/[\W_]+/g, '').toLowerCase()){
                place_id = place.id;
            }
        })

        tweetSet.data.forEach(tweet => {
            if(tweet.geo != undefined && tweet.geo.place_id == place_id){
                filteredSet.push(tweet);
            }
        });
    } 
        
        /* DOVREBBE ESSERE quello fatto bene ma non vanno le richieste https
        let options = {
            hostname: 'google.com',//'nominatim.openstreetmap.org',
            port: 443,
            path: '/search?q=miao&oq=miao&aqs=chrome..69i57j46j0l6.700j0j15&sourceid=chrome&ie=UTF-8',//'/search/' + search.value.replace(/\s/g, '') + '?format=json&addressdetails=1&limit=1'
            method: 'GET'
        };
        
        let request = https.request(options, response => {
            response.on('data', d =>{
                console.log(d);
            });
            request.on('error', error => {
                console.error(error);
            });
            request.end();
        });
        //let req_boundingbox = JSON.parse();
    }*/

    res.header("Content-Type", 'application/json');
    res.send(filteredSet);
});

app.post("/addRule", function (req, res) {
    console.log(req.body);
    let err = null;
    for(let i = 0; i < req.body.length; i++){
        (async() => {
            err = await setFilter(req.body[i].tipo + ':' + req.body[i].valore, req.body[i].valore); //non sono sicuro si settino così i filtri ma whatever
            if (err)
                res.status(500).send("errore nell'aggiunta di filtri");
        })
    }
    res.send("flitri aggiunti");
});

app.listen(8000, () => {
    console.log(`app listening at http://localhost:8000`);
});