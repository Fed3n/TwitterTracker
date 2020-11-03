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
			else this.labels.push({type:type, value:input});

			this.$refs.filterinput.value="";
			this.tweets.sort();
		},
		removefilter: function(elem){
			let index=0;
			while(index<this.labels.length){
				if(this.labels[index]==elem){//controlla
					this.labels.splice(index,1);
					index=this.labels.length;
				}
				index++;
			}
		},
		filters: function(type){
			let count=0;
			this.labels.forEach(label=>{if(label.type==type)count++});
			return count;
		},
		showinfo:function(data){
			console.log(data);
        },
        toggleStream:function(){
            let expr = this.$refs.streamfilter.value;
            //stream
		},
		appendtweets: function(newtweets){
			newtweets.forEach(elem=>{
				this.tweets.push(elem);
			});
		},
		search: function(){
			let newexpr = this.$refs.searchfilter.value;
			$.get("/search", {expr:newexpr, lim:100}).done(function(newtweets){
				container.appendtweets(newtweets);
			});
		},
		righthashtags:function(tweet){ //ora deve combaciare con tutti gli hashtag, chiedere se va bene
			if(this.filters("Hashtag")==0) {return true;}
			if(!tweet.entities || !tweet.entities.hashtags) {return false;}
			let isright=true;
			this.labels.forEach(label=>{
				let contains=false;
				tweet.entities.hashtags.forEach(tag => {
					if(label.type=="Hashtag" && tag.tag == label.value) contains=true;
				})
				if(!contains) {isright=false;}
			});
			return isright;
		},
		rightlocation:function(){ //da debuggare
			if(this.filters("Location")==0) {return true;}
			this.labels.forEach(label=>{
				if(label.type=="Location"){

					var place_ids = [];
					var bbox = label.boundingBox;
					bbox = bbox.map(function (x) { 
						return parseFloat(x, 10); 
					});
					
					tweets.places.forEach(place => { //inserire giusto campo con la posizione
						let place_bbox = place.geo.bbox;
						let coords = [
							(place_bbox[0]+place_bbox[2])/2,
							(place_bbox[1]+place_bbox[3])/2
						];
						if(bbox[2] <= coords[0] && bbox[3] >= coords[0] && 
							bbox[0] <= coords[1] && bbox[1] >= coords[1]){
							place_ids.push(place.id);
						}
					});
						
					if(tweet.geo != undefined && place_ids.indexOf(tweet.geo.place_id) > -1) return true;
				}
			});
			return false;
		}
    },
    computed:{
		computedtweets:function() {
            comp = [];
            this.tweets.forEach(tweet=>{
				if(this.righthashtags(tweet)&&this.rightlocation(tweet)){
					console.log(tweet);
					comp.push(tweet);
				}
            });
            return comp;
		}
    }
})