var modal = new Vue({
	el:"#modal",
	data:{
		tweet: null,
		errormsg: "",
	},
	methods:{
		removeMarkers: function(){
			map.DeleteAllMarkers();
		},
		addMarker: function(data){
			var images = null;
			if(data.entities.media){
				images = [];
				for(img of data.entities.media){
					images.push(img.media_url);
					console.log()
				}
			}
			console.log(images)
			if(images && images.length > 0)
				map.AddMarker(data.geo.coordinates[0], data.geo.coordinates[1], data.text, images);
			else
				map.AddMarker(data.geo.coordinates[0], data.geo.coordinates[1], data.text, null);
		},
		reset: function(){
			this.removeMarkers();
			this.tweet=null;
			this.errormsg="";
			$("#map").hide();
		},
		showTweet: function(tweet){
			this.reset();

			this.tweet=tweet;
			if(tweet.geo && tweet.geo.coordinates){
				this.addMarker(tweet);
				$("#map").show();
			}
			this.show();
		},
		showMap: function(){
			this.reset();

			for(tweet of container.computedtweets){
				if(tweet.geo && tweet.geo.coordinates)
					this.addMarker(tweet);
			}

			$("#map").show();
			this.show();
		},
		showError: function(msg){
			this.reset();
			this.errormsg=msg;
			this.show();
		},
		show: function(){
			$(".modal").modal();
		}
	}
})