const express = require('express');
const bodyParser = require("body-parser");
const twitter_Api = require('./twitter_api.js');
const fs = require('fs');

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
    let rawData = fs.readFileSync(__dirname + '/tests/covidSample.json');
    let tweetSet = JSON.parse(rawData);

    let search = req.body;

    let filteredSet = [];

    if(search.param == "hashtag"){
        tweetSet.forEach(tweet => {
            tweet.hashtagEntities.forEach(tag => {
                if(tag.text == search.value)
                    filteredSet.push(tweet);
            });
        });
    }
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