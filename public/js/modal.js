var modal = new Vue({
	el:"#modal",
	data:{
		//when tweet != null tweet informations shown on modal
		tweet: null,
		//when errormsg != null modal shows the error message
		errormsg: "",
	},
	methods:{
		//delete markers from map
		removeMarkers: function(){
			map.DeleteAllMarkers();
		},
		//add marker to map with tweet info
		addMarker: function(data){
			var images = null;
			if(data.entities.media){
				//map.AddMarker needs an array of image urls
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
		//called at the start of every show function
		reset: function(){
			//remove markers, tweets and messages
			this.removeMarkers();
			this.tweet=null;
			this.errormsg="";
			//hide map
			$("#map").hide();
		},
		//show modal with a single tweet info
		showTweet: function(tweet){
			this.reset();

			this.tweet=tweet;
			if(tweet.geo && tweet.geo.coordinates){
				this.addMarker(tweet);
				$("#map").show();
			}
			this.show();
		},
		//show map with every tweet position
		showMap: function(){
			this.reset();

			for(tweet of container.computedtweets){
				if(tweet.geo && tweet.geo.coordinates)
					this.addMarker(tweet);
			}

			$("#map").show();
			this.show();
		},
		//show an error window
		showError: function(msg){
			this.reset();
			this.errormsg=msg;
			this.show();
		},
		//once the modal info are set, the modal can be shown
		show: function(){
			$(".modal").modal();
		}
	}
})