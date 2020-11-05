const express = require('express');
const bodyParser = require("body-parser");
const twitter_api = require('./twitter_api.js');
const newapi = require('./newapi.js');
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

//###NEW API###

/* vd https://developer.twitter.com/en/docs/twitter-api/v1/tweets/search/api-reference/get-search-tweets per parametri da passare a search
 * passate uno per uno quelli che volete usare nella query e la funzione fa parsing e li mette in un oggetto params*/
app.get("/new/search", async function (req, res) {
    let params = {};
    console.log(req.query);
    for(let field in req.query){
        params[field] = req.query[field];
    }
    let arr = await newapi.recentSearch(params);
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

/* vd https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/api-reference/post-statuses-filter per parametri da passare a search
 * passate uno per uno quelli che volete usare nella query e la funzione fa parsing e li mette in un oggetto params*/
app.post("/new/stream/start", async function (req, res) {
    console.log("in stream");
    let params = {};
    console.log(req.query);
    for(let field in req.query){
        params[field] = req.query[field];
    }
    console.log('Stream params: ' + params);
    try {
        newapi.startStream(params);
        return res.status(200).send("Stream started.");
    } catch(err) {
        console.log(err);
        return res.status(500).send("Whoops @ stream");
    }
});

//ferma lo stream
app.post("/new/stream/stop", async function(req, res) {
    try{
        await newapi.closeStream();
        return res.status(200).send("Stream stopped.");
    } catch(err){
        console.log(err);
        return res.status(500).send("Very very bad");
    }
});

//svuota il buffer dello stream e lo restituisce
app.get("/new/stream", function (req,res) {
    let arr = newapi.stream_arr.slice();
    newapi.stream_arr = [];
    res.setHeader('Content-Type', 'application/json');  
    return res.status(200).send(arr);
});

app.listen(8000, () => {
    console.log(`app listening at http://localhost:8000`);
});
