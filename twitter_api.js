/*API di base che implementa la funzione di stream filtrato e non*/
const axios = require('axios');
const fs = require('fs');

//INSERIRE TOKEN vvv
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAIfdIwEAAAAAO5RY%2FGsvF4lZlch0Wv%2Bf65NQc%2Bg%3DmFVfzJK1AHQbtvsP3khEEaJLhZxmloBcefCcN0FI49jz67lE1V'

const FILTERED_STREAM_URL = 'https://api.twitter.com/2/tweets/search/stream'
const STREAM_URL = 'https://api.twitter.com/2/tweets/sample/stream'
const SEARCH_URL = 'https://api.twitter.com/2/tweets/search/recent'
const RULES_URL = 'https://api.twitter.com/2/tweets/search/stream/rules'

//TODO FUNZIONE CHE MODIFICHI I PARAMETRI params PER DECIDERE COSA FARSI RITORNARE
const STREAM_CONFIG = {
    //non ho investigato pero' si possono richiedere
    //svariate altre informazioni sui tweet estratti
    //cambiando i parametri della richiesta
    params: {
        'tweet.fields': 'created_at,entities',
        'expansions': 'author_id,geo.place_id',
        'user.fields': 'created_at'
    },
    responseType: 'stream',
    headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
    }
};
const SEARCH_CONFIG = {
    params: {
        'tweet.fields': 'created_at,entities',
        'expansions': 'author_id,geo.place_id',
        'place.fields': 'name',
        'user.fields': 'created_at',
        'max_results': '',
        'query': ''
    },
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
const search_token = CancelToken.source();

//FUNZIONE DI STREAM, WRAPPERS, CANCELLAZIONE REQ
//funzione che inizializza lo stream di tweets

module.exports = {
//Results for streams and searches are these arrays
stream_array: [],
search_array: [],

//RULES SETTING AND REMOVAL FOR RULED STREAMS//
removeAllRules: async function(){
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
},

//vd. https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
setFilter: async function(expression, name){
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
},
//#########################################################
startStream: function(url){
    let config = {};
    Object.assign(config, STREAM_CONFIG);
    //token per la cancellazione
    config['cancelToken'] =  stream_token.token;
    axios.get(url, config).then((res) => {
        console.log('Beginning stream...');
        let stream = res.data;
        stream.on('data', (tweet_data) => {
            //Stream restituisce dei chunk di bytes, bisogna fare parsing in JSON
            //Ogni chunk e' un tweet restituito dallo stream
            try {
                let parsed_json = JSON.parse(tweet_data);
                console.log(parsed_json);
                this.stream_array.push(parsed_json);
            }
            catch(err) {
                //boh occasionalmente arrivano chunk corrotti
                //li ignoro :')))
                console.log(err);
                }
        });
        stream.on('end', () => { console.log("Fine") });
    }).catch((err) => { throw(err) });
},

//funzione wrapper per stream senza filtri
//ritorna un cancelToken
stdStream: async function(){
    this.startStream(STREAM_URL);
},

//funzione wrapper per stream filtrato
//ritorna un cancelToken
ruledStream: async function(){
    this.startStream(FILTERED_STREAM_URL);
},

//cancella tutti gli stream request in corso
//se non ha parametri salva il dump come tweet_dump.txt
closeStream: function(){
    stream_token.cancel();
},
//####################################################

//FUNZIONI DI SEARCH, CANCELLAZIONE REQ
//query nel solito formato vd sopra rules, number e' numero di tweet restituiti default 10 max 100
//TODO non ho capito che cazzo mi restituisce somebody do it thanks
recentSearch: async function(query, number){
    let err = null;
    let config = {};
    Object.assign(config, SEARCH_CONFIG);
    config['params']['query'] = query;
    if(number) config['params']['max_results'] = number;
    try {
        let res = await axios.get(SEARCH_URL, SEARCH_CONFIG);
        console.log(res.data);
        this.search_array = res.data;
    }
    catch(error) {
        console.log(error); err = error; 
    }
    return err;
},


saveStreamToJson: function(path='./stream_dump.txt'){
    let dump = JSON.stringify(this.stream_array);
    fs.writeFileSync(path, dump);
},
saveSearchToJson: function(path='./search_dump.txt'){
    let dump = JSON.stringify(this.search_array);
    fs.writeFileSync(path, dump);
}

};
