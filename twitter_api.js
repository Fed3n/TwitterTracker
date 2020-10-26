/*API di base che implementa la funzione di stream filtrato e non*/

const axios = require('axios');
const fs = require('fs');
const express = require('express');
const bodyParser = require("body-parser");

var app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());



//INSERIRE TOKEN vvv
const BEARER_TOKEN = '';

const FILTERED_STREAM_URL = 'https://api.twitter.com/2/tweets/search/stream'
const STREAM_URL = 'https://api.twitter.com/2/tweets/sample/stream'
const RULES_URL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const STREAM_CONFIG = {
    //non ho investigato pero' si possono richiedere
    //svariate altre informazioni sui tweet estratti
    //cambiando i parametri della richiesta
    params: {
        'tweet.fields': 'created_at',
        'expansions': 'author_id',
        'user.fields': 'created_at'
    },
    responseType: 'stream',
    headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
    }
};
const RULES_CONFIG = {
    'Content-Type': 'application/json',
    headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
    }
};
var tweet_collection = [];

async function removeAllRules(){
    //Prendo tutte le regole impostate (get)
    axios.get(RULES_URL, RULES_CONFIG).then((res) => {
        rules = res.data.data;
        console.log(rules);
        //Se mi ha dato un array vuoto nessuna regola da cancellare
        if(rules && rules.length > 0){
            rules_ids = rules.map(rule => rule.id);
            req = {
                'delete': {
                    'ids': rules_ids
                }
            };
            //Cancello tutte le regole impostate (post)
            axios.post(RULES_URL, req, RULES_CONFIG).then((res) => {
                console.log('Rules deleted.');
            }).catch((err) => { console.log(err) });
        }
        else console.log('No rules to delete.');
    }).catch((err) => { console.log(err) });
    return;
}

//vd. https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
async function setFilter(expression, name){
    let rules = {
        'add': [
            {'value': expression, 'tag': name}
        ]
    };
    //Setto il filtro delle regole
    axios.post(RULES_URL, rules, RULES_CONFIG).then((res) => {
        console.log(`Rules set with tag ${name}.`);
        console.log(res.data);
    }).catch((error) => { console.log(error) });
    return;
}

function startStream(url){
    axios.get(url, STREAM_CONFIG).then((res) => {
        console.log('Beginning stream...');
        let stream = res.data;
        stream.on('data', (tweet_data) => {
            //Stream restituisce dei chunk di bytes, bisogna fare parsing in JSON
            //Ogni chunk e' un tweet restituito dallo stream
            try {
                let parsed_json = JSON.parse(tweet_data);
                console.log(parsed_json);
                tweet_collection.push(parsed_json);
            }
            catch(err) {
                //boh occasionalmente arrivano chunk corrotti
                //li ignoro :')))
                }
        });
        stream.on('end', () => { console.log("Fine") });
    });
}

function stdStream(){
    startStream(STREAM_URL);
}

function ruledStream(){
    startStream(FILTERED_STREAM_URL);
}



//TEST eseguibile con node dopo npm install axios//
//Non ho idea di come chiudere lo stream request quindi al CTRL+C salvo il dump in plaintext
function saveToJson(){
    let dump = JSON.stringify(tweet_collection);
    fs.writeFileSync('./tweet_dump.txt', dump);
    process.exit();
}

process.on('SIGINT', saveToJson);

/*(async() => {
    await removeAllRules();
    await setFilter('to:realdonaldtrump', 'tweets to trump');
    ruledStream();
    //stdStream();
})();*/


app.get("/", function (req, res) {
    res.render("index");
});

app.post("/addRule", function (req, res) {
    console.log(req.body);
    for(let i = 0; i < req.body.length(); i++){
        //aggiungere il filtro. ci guardo domani come li gestisce fede. Sono stanco e ho fame. Buon appetito
    }
    res.send("flitri aggiunti");
});

app.listen(8000, () => {
    console.log(`app listening at http://localhost:8000`);
});