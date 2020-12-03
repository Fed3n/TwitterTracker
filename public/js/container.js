var filtercounter={};
var container = new Vue({
	el: "#container",
	data:{
		labels: [],
		tweets: [],
		settings: ["Id","Username","Text","Retweets","Date","Likes", "Images"], //inserire i potenziali parametri utili
		checkedsettings: ["Username","Text","Date"],
		checkedFilters: [],
		stream_on: false,
		local_filters: ["Contains","Hashtag","Location"],
		lastSorted: "",

		//queries
		is_stream: true,	
		stream_query: {},
		search_query: {},
		prova: 0
	},
	methods:{
		addfilter: function(){
			let type = this.$refs.filtertype.value;
			let input = this.$refs.filterinput.value;
			let hasLocation = this.$refs.hasLocation.checked;
			
			if(hasLocation != filtercounter["hasLocation"]){
				filtercounter["hasLocation"] = hasLocation;
				return;
			}
			if(type=="Location"){
				let url = "http://nominatim.openstreetmap.org/search/"+input.split(' ').join('%20')+'?format=json&addressdetails=1&limit=1';
				$.get(url,function(data){ container.labels.push({type:"Location", value: input, boundingBox:data[0].boundingbox}); }, "json");
			}
			else 
				this.labels.push({type:type, value:input});
			if(filtercounter[type])
				filtercounter[type]++;
			else
				filtercounter[type]=1;

			this.$refs.filterinput.value="";
		},
		removefilter: function(elem){
			let index=0;
			while(index<this.labels.length){
				if(this.labels[index]==elem){
					filtercounter[elem.type]--;
					this.labels.splice(index,1);
					index=this.labels.length;
				}
				index++;
			}
		},
		showinfo: function(data){
			modal.showTweet(data);
		},
		
		//switches query view from stream to search and viceversa
		switchQuery: function(){
			if(this.is_stream){
				//before switching view makes sure steam is off
				if(this.stream_on)
					$.post("/stream/stop").done(function(){console.log("close stream");});
				this.$refs.streamtrack.value = "";
				this.$refs.streamfollow.value = "";
				this.$refs.streamlocations.value = "";
				this.is_stream = false;
			} else {
				this.$refs.searchquery.value = "";
				this.$refs.searchgeo.value = "";
				this.$refs.searchlan.value = "";
				this.$refs.searchcount.value = 100;
				this.is_stream = true;
			}
		},

		//queries a tweets stream by parameters to the server
		toggleStream: async function(){
			//se lo stream e' off parte, se e' on si interrompe
			this.stream_on=!this.stream_on;
			if(this.stream_on){
				//passa valori dei campi al parser
				let params = await queryparser.parseStreamQuery(
					this.$refs.streamtrack.value,
					this.$refs.streamfollow.value,
					this.$refs.streamlocations.value);
				
				//se il parser ha ridato parametri allora si puo' eseguire query
				if(params){
					$.post("/stream/start?"+$.param(params)).done(function(){
						console.log("start stream");
						container.updatestream();
					}).fail(function() {
						window.alert("Stream querying failed. Please check your parameters.");
						this.stream_on = false;
					});
				}
				else {
					window.alert("Insert at least one field.");
					this.stream_on = false;
				}
			} else {
				$.post("/stream/stop").done(function(){console.log("close stream");});
			}
		},
		updatestream: function(){
			if(this.stream_on){
				$.get("/stream", function(data){
					container.appendtweets(data);
					window.setTimeout(container.updatestream,1000);
				},"json")
			}
		},
		appendtweets: function(newtweets){
			for(newTweet of newtweets){
				let isin = false;
				for(oldTweet of this.tweets){
					if(oldTweet.id==newTweet.id){isin=true;}
				}
				if(!isin){this.tweets.unshift(newTweet);}
			};
		},
		//queries a tweets search by parameters to the server
		search: async function(){
			if(!this.$refs.searchquery.value){ 
				window.alert("Query field is mandatory");
				return;
			}
			
			let params = await queryparser.parseSearchQuery(
				this.$refs.searchquery.value,
				this.$refs.searchgeo.value,
				this.$refs.searchlan.value,
				this.$refs.searchcount.value);

			if(params){
				$.get("/search", params).done(function(newtweets){
					container.appendtweets(newtweets);
				});
			} else {
				window.alert("Not enough parameters or something went wrong.\n");
			}
		},
		righthashtags:function(tweet){ //ora deve combaciare con tutti gli hashtag, chiedere se va bene
			if(!filtercounter["Hashtag"]||filtercounter["Hashtag"]==0) {return true;}
			if(!tweet.entities || !tweet.entities.hashtags) {return false;}
			let contains;
			for(label of this.computedfilters()){
				if(label.type=="Hashtag"){
					contains = false;
					for(tag of tweet.entities.hashtags){
						if(tag.text == label.value) {
							if(this.checkedFilters.length==0)
								return true;
							contains = true;
						}
						else
						{
							if(this.checkedFilters.length>0)
								return false;
						}
					}
				}
			};
			return contains;
		},
		rightlocation:function(tweet){ //da debuggare
			if(!filtercounter["Location"]||filtercounter["Location"]==0) {return true;}
			if (!tweet.place || !tweet.place.bounding_box || !tweet.place.bounding_box.coordinates){return false;}
			let contains;
			for(label of this.computedfilters()){
				if(label.type=="Location"){
					contains = false;

					var bbox = label.boundingBox;
					bbox = bbox.map(function (x) { 
						return parseFloat(x, 10); 
					});

					coords = tweet.place.bounding_box.coordinates[0];
					coords = [
						parseFloat(coords[0][1], 10),
						parseFloat(coords[2][1], 10),
						parseFloat(coords[0][0], 10),
						parseFloat(coords[1][0], 10)
					]
					parsedCoords = [
						(coords[0] + coords[1])/2,
						(coords[2] + coords[3])/2
					]
					if(bbox[0] <= parsedCoords[0] && bbox[1] >= parsedCoords[0] && bbox[2] <= parsedCoords[1] && bbox[3] >= parsedCoords[1]){
						if(this.checkedFilters.length==0)
							return true;
						contains=true;
					}else{
						if(this.checkedFilters.length>0)
							return false;
					}						
				}
			}
			return contains;
		},
		rightcontains: function(tweet){
			if(!filtercounter["Contains"]||filtercounter["Contains"]==0) {return true;}
			if (!tweet.text){return false;}
			let contains;
			for(label of this.computedfilters()){
				contains=false;
				if(label.type=="Contains"){
					if(tweet.text.includes(label.value)) {
						if(this.checkedFilters.length==0)
							return true;
						contains = true
					}else{
						if(this.checkedFilters.length>0)
							return false;
					}
				}
			}
			return contains;

		},
		sortTweets:function(setting){
			if(setting == this.lastSorted){
				this.tweets = this.tweets.reverse();
			} else {
				this.lastSorted = setting;
				switch(setting){
					case "Id":
						this.tweets.sort((x,y) => {if(x.id < y.id) return -1; else return 1});
						break;
					case "Username":
						this.tweets.sort((x,y) => {if(x.user.name < y.user.name) return -1; else return 1});
						break;
					case "Text":
						this.tweets.sort((x,y) => {if(x.text < y.text) return -1; else return 1});
						break;
					case "Likes":
						this.tweets.sort((x,y) => {if(x.favorite_count < y.favorite_count) return -1; else return 1});
						break;
					case "Retweets":
						this.tweets.sort((x,y) => {if(x.retweet_count < y.retweet_count) return -1; else return 1});
						break;
					case "Date":
						this.tweets.sort((x,y) => {if(Date.parse(x.created_at) < Date.parse(y.created_at)) return -1; else return 1}); 
						break;
				}
			}
		},
		computedfilters: function() {
			if(this.checkedFilters.length>0){
				let comp = [];
				for(index of this.checkedFilters){
					comp.push(this.labels[index]);
				}
				return comp;
			}
			return this.labels;
		}
    },
    computed:{
		computedtweets: function() {
			//TODO Locations si bugga se non esiste (per riprodurre aggiungi filtro location:"aidahsodabosdasb")
			this.labels;
			this.checkedFilters;
			let comp = [];
			for(tweet of this.tweets){
				if(this.righthashtags(tweet)&&this.rightlocation(tweet)&&this.rightcontains(tweet)&& ((filtercounter["hasLocation"] && tweet.geo) || filtercounter["hasLocation"] == false)){

					comp.push(tweet);
				}
			};
    	    return comp;
		},
		computedchecks:{
			get(){
				return this.checkedsettings.length>0;
			},
			set(){}
		}
	}
})
