/*API di base che implementa la funzione di stream filtrato e non*/

const axios = require('axios');
const fs = require('fs');



//INSERIRE TOKEN vvv
const BEARER_TOKEN = ''

const FILTERED_STREAM_URL = 'https://api.twitter.com/2/tweets/search/stream'
const STREAM_URL = 'https://api.twitter.com/2/tweets/sample/stream'
const RULES_URL = 'https://api.twitter.com/2/tweets/search/stream/rules'

//TODO FUNZIONE CHE MODIFICHI I PARAMETRI params PER DECIDERE COSA FARSI RITORNARE
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

//canceltoken factory
const CancelToken = axios.CancelToken;
//token dello stream request
const stream_token = CancelToken.source();


var tweet_collection = [];

async function removeAllRules(){
    try {
        //Prendo tutte le regole impostate (get)
        let res = await axios.get(RULES_URL, RULES_CONFIG);
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
    }
    catch(err){
        throw(err);
    }
    return;
}

//vd. https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
async function setFilter(expression, name){
    let err = null;
    let rules = {
        'add': [
            {'value': expression, 'tag': name}
        ]
    };
    try {
        //Setto il filtro delle regole
        let res = await axios.post(RULES_URL, rules, RULES_CONFIG);
        console.log(`Rules set with tag ${name}.`);
        console.log(res.data);
    }
    catch(error) { 
        console.log(error); err = error;
    }
    return err;
}

//funzione che inizializza lo stream di tweets
function startStream(url){
    //Creo un token per interrompere lo stream request
    //si interrompe chiamando cancel_token.cancel()
    //var cancel_token = axios.CancelToken.source();
    let config = {};
    Object.assign(config, STREAM_CONFIG);
    config["cancelToken"] =  stream_token.token;
    axios.get(url, config).then((res) => {
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
                console.log('Failed parsing');
                }
        });
        stream.on('end', () => { console.log("Fine") });
    }).catch((err) => { throw(err) });
}

//funzione wrapper per stream senza filtri
//ritorna un cancelToken
async function stdStream(){
    startStream(STREAM_URL);
}

//funzione wrapper per stream filtrato
//ritorna un cancelToken
async function ruledStream(){
    startStream(FILTERED_STREAM_URL);
}

//cancella tutti gli stream request in corso
function closeStream(){
    stream_token.cancel();
}



//TEST eseguibile con node dopo npm install axios//
function saveToJson(){
    let dump = JSON.stringify(tweet_collection);
    fs.writeFileSync('./tweet_dump.txt', dump);
    process.exit();
}

process.on('SIGINT', saveToJson);

/*(async() => {
    await removeAllRules();
    await setFilter('#BLM', 'black lives matter');
    //ruledStream();
    stdStream();
    setTimeout( function(){
        closeStream();
    }, 5000);
})();*/
