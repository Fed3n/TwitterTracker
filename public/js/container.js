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
		toggleStream: async function(){
			this.stream_on=!this.stream_on;
			if(this.stream_on){
				let params = {};
				if(this.$refs.streamtrack.value) params["track"] = this.$refs.streamtrack.value;
				if(this.$refs.streamfollow.value) {
					let queries = '';
					for(name of this.$refs.streamfollow.value.split(',')){
						console.log(`looking for ${name}`);
						let user = await $.get(`/user?screen_name=${name}`);
						console.log(`response is ${user.id}`);
						queries += `${user.id},`;
					}
					console.log(queries);
					params["follow"] = queries.slice(0,queries.length-1);
				}
				//per ogni citta' nella query sostituisco il boundingbox
				if(this.$refs.streamlocations.value) {
					let queries = '';
					for(loc of this.$refs.streamlocations.value.split(',')){
						let geoloc = await geoutils.getCoordsFromLoc(loc);
						let box = geoloc.box; 
						if(box){
							queries += `${box.sw.lon},${box.sw.lat},${box.ne.lon},${box.ne.lat},`;
						}
					}
					params["locations"] = queries.slice(0,queries.length-1);
				}
				
				if(Object.keys(params).length){
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
				if(!isin){this.tweets.push(newTweet);}
			};
		},
		search: async function(){
			let params = {};
			if(this.$refs.searchquery.value) params["q"] = this.$refs.searchquery.value;
			else {
				window.alert("Query field is mandatory");
				return;
			}

			if(this.$refs.searchgeo.value) {
				let geoloc = await geoutils.getCoordsFromLoc(this.$refs.searchgeo.value);
				let coords = geoloc.coords;
				let boxrad = geoloc.radius;
				//per ora 1mile ma dovrebbe essere settabile ~~
				params["geocode"] = `${coords.lat},${coords.lon},${boxrad}km`;
			}
			if(this.$refs.searchlan.value) params["lang"] = this.$refs.searchlan.value;
			if(this.$refs.searchcount.value) params["count"] = this.$refs.searchcount.value;
			
			if(Object.keys(params).length){
				$.get("/search", params).done(function(newtweets){
					container.appendtweets(newtweets);
				});
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
					case "id":
						this.tweets.sort((x,y) => {if(x.id < y.id) return -1; else return 1});
						break;
					case "username":
						this.tweets.sort((x,y) => {if(x.user.name < y.user.name) return -1; else return 1});
						break;
					case "text":
						this.tweets.sort((x,y) => {if(x.text < y.text) return -1; else return 1});
						break;
					case "likes":
						this.tweets.sort((x,y) => {if(x.favoriteCount < y.favoriteCount) return -1; else return 1});
						break;
					case "retweets":
						this.tweets.sort((x,y) => {if(x.retweetCount < y.retweetCount) return -1; else return 1});
						break;
					case "created_at":
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
				if(this.righthashtags(tweet)&&this.rightlocation(tweet)&&this.rightcontains(tweet)){
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