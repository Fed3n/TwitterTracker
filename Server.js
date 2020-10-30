const express = require('express');
const bodyParser = require("body-parser");
const twitter_Api = require('./twitter_api.js');

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