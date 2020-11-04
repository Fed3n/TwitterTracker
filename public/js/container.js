var filtercounter={};
var container = new Vue({
	el: "#container",
	data:{
		labels: [],
		tweets: [],
		stream_on: false,
        local_filters: ["Hashtag","Location"]
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
			this.tweets.sort();
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
			console.log(data);
        },
		toggleStream: function(){
			this.stream_on=!this.stream_on;
			if(this.stream_on){
				let expr = this.$refs.streamfilter.value;
				$.post("/stream/start",{expr:expr}).done(function(){
					console.log("start stream")
					container.updatestream();
				});
			}else{
				$.post("/stream/stop").done(function(){console.log("close stream");});
			}
		},
		updatestream: function(){
			if(this.stream_on){
				$.get("/stream", function(data){
					console.log("Richiesta");
					container.appendtweets(data);
					window.setTimeout(container.updatestream,1000);
				},"json")
			}
		},
		appendtweets: function(newtweets){
			for(elem of newtweets){
				this.tweets.push(elem);
			};
		},
		search: function(){
			let newexpr = this.$refs.searchfilter.value;
			$.get("/search", {expr:newexpr, lim:100}).done(function(newtweets){
				container.appendtweets(newtweets);
			});
		},
		righthashtags:function(tweet){ //ora deve combaciare con tutti gli hashtag, chiedere se va bene
			if(!filtercounter["Hashtag"]||filtercounter["Hashtag"]==0) {return true;}
			if(!tweet.entities || !tweet.entities.hashtags) {return false;}
			for(label of this.labels){
				let contains=false;
				for(tag of tweet.entities.hashtags){
					if(label.type=="Hashtag" && tag.tag == label.value) contains=true;
				}
				if(!contains) {return false}
			};
			return true;
		},
		rightlocation:function(tweet){ //da debuggare
			if(!filtercounter["Location"]||filtercounter["Location"]==0) {return true;}
			for(label of this.labels){
				if(label.type=="Location"){

					var place_ids = [];
					var bbox = label.boundingBox;
					bbox = bbox.map(function (x) { 
						return parseFloat(x, 10); 
					});
					
					for (place of tweet.places) { //inserire giusto campo con la posizione
						let place_bbox = place.geo.bbox;
						let coords = [
							(place_bbox[0]+place_bbox[2])/2,
							(place_bbox[1]+place_bbox[3])/2
						];
						if(bbox[2] <= coords[0] && bbox[3] >= coords[0] && 
							bbox[0] <= coords[1] && bbox[1] >= coords[1]){
							place_ids.push(place.id);
						}
					};
						
					if(tweet.geo != undefined && place_ids.indexOf(tweet.geo.place_id) > -1) return true;
				}
			};
			return false;
		}
    },
    computed:{
		computedtweets:function() {
            comp = [];
            for (tweet of this.tweets){
				if(this.righthashtags(tweet)&&this.rightlocation(tweet)){
					console.log(tweet);
					comp.push(tweet);
				}
            };
            return comp;
		}
    }
})