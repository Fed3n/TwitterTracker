//meme di martina per far andare values su tutti i browsers
Object.values = Object.values || function (o) { return Object.keys(o).map(function (k) { return o[k] }) };

var filtercounter = {};
var container = new Vue({
	el: "#container",
	data: {
		labels: [],
		tweets: [],
		//WATCHERS//
		current_tab: 0,
		pagewatchers: [],
		allwatchers: [],
		//
		settings: ["Username", "Text", "Retweets", "Date", "Likes", "Images"], //inserire i potenziali parametri utili
		checkedsettings: ["Username", "Text", "Date"],
		checkedFilters: [],
		onlyLocated: false,
		stream_on: false,
		local_filters: ["Contains", "Hashtag", "Location"],
		lastSorted: "",

		//queries
		is_stream: true,
		stream_query: {},
		search_query: {},

		//graphs
		doughnutG: {},
		lineG: {},
		barG: {}
	},
	mounted: function () {
		window.setInterval(this.updateStream, 1000);
		window.setInterval(this.updateWatchers, 1000);
	},
	methods: {
		addfilter: function () {
			let type = this.$refs.filtertype.value;
			let input = this.$refs.filterinput.value;
			if (type == "Location") {
				let url = "http://nominatim.openstreetmap.org/search/" + input.split(' ').join('%20') + '?format=json&addressdetails=1&limit=1';
				$.get(url, function (data) {
					console.log(data[0]);
					if (data[0] && data[0].boundingbox) { container.labels.push({ type: "Location", value: input, boundingBox: data[0].boundingbox }); }
					else { modal.showError("There's an error with your location"); }
				}, "json");
			}
			else
				this.labels.push({ type: type, value: input });
			if (filtercounter[type])
				filtercounter[type]++;
			else
				filtercounter[type] = 1;

			this.$refs.filterinput.value = "";
		},
		removefilter: function (elem) {
			let index = 0;
			while (index < this.labels.length) {
				if (this.labels[index] == elem) {
					filtercounter[elem.type]--;
					this.labels.splice(index, 1);
					index = this.labels.length;
				}
				index++;
			}
		},
		showinfo: function (data) {
			modal.showTweet(data);
		},
		showWatcherModal() {
			modal.showWatcher();
		},
		switchTab: function (index) {
			this.current_tab = index;
			if (index > 0) this.pagewatchers[index - 1].news = false;
		},

		//switches query view from stream to search and viceversa
		switchQuery: function () {
			if (this.is_stream) {
				//before switching view makes sure steam is off
				if (this.stream_on)
					$.post("/stream/stop").done(function () { console.log("close stream"); });
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
		toggleStream: async function () {
			//se lo stream e' off parte, se e' on si interrompe
			this.stream_on = !this.stream_on;
			if (this.stream_on) {
				//passa valori dei campi al parser
				let params = await queryparser.parseStreamQuery(
					this.$refs.streamtrack.value,
					this.$refs.streamfollow.value,
					this.$refs.streamlocations.value);

				//se il parser ha ridato parametri allora si puo' eseguire query
				if (params) {
					$.post("/stream/start?" + $.param(params)).done(function () {
						console.log("start stream");
					}).fail(function () {
						window.alert("Stream querying failed. Please check your parameters.");
						this.stream_on = false;
					});
				}
				else {
					window.alert("Insert at least one field.");
					this.stream_on = false;
				}
			} else {
				$.post("/stream/stop").done(function () { console.log("close stream"); });
			}
		},
		updateStream: function () {
			if (this.stream_on) {
				$.get("/stream", function (data) {
					container.appendtweets(data);
				}, "json")
			}
		},
		appendtweets: function (newtweets) {
			for (newTweet of newtweets) {
				let isin = false;
				for (oldTweet of this.tweets) {
					if (oldTweet.id == newTweet.id) { isin = true; }
				}
				if (!isin) { this.tweets.unshift(newTweet); }
			};
		},
		//queries a tweets search by parameters to the server
		search: async function () {
			if (!this.$refs.searchquery.value) {
				window.alert("Query field is mandatory");
				return;
			}

			let params = await queryparser.parseSearchQuery(
				this.$refs.searchquery.value,
				this.$refs.searchgeo.value,
				this.$refs.searchlan.value,
				this.$refs.searchcount.value);

			if (params) {
				$.get("/search", params).done(function (newtweets) {
					container.appendtweets(newtweets);
				});
			} else {
				window.alert("Not enough parameters or something went wrong.\n");
			}
		},
		//to be called at intervals, updates info on server side watchers
		//and updates page watchers
		updateWatchers: function () {
			$.get("/watch").then(function (res) {
				watchers = [];
				//dont ask its ok dw about this unless you're me then fk
				for (el of res) {
					for (aw of container.allwatchers)
						if (el.name == aw.name && (!el.news) && (aw.news)) {
							el.news = true;
							break;
						}
					watchers.push(el);
				}
				container.allwatchers = watchers;
			})
				.catch(function (err) {
					throw (err);
				});
			let namelist = [];
			for (watcher of this.pagewatchers) {
				namelist.push(watcher.name);
			}
			if (namelist.length > 0) {
				$.get("watch/data?" + $.param({ "namelist": namelist })).then(function (res) {
					let reqwatchers = res;
					//same as above m8b worse
					for (let i = 0; i < container.pagewatchers.length; i++) {
						//asynchronicity misteries so better check
						if (reqwatchers[i]) {
							if (container.pagewatchers[i].news && !reqwatchers[i].news) reqwatchers[i].news = true;
						}
					}
					container.pagewatchers = reqwatchers;
				})
					.catch(function (err) {
						throw (err);
					});
			}
		},
		//takes an existing watcher name not loaded on page and loads it by querying server
		bringWatcher: function (name) {
			$.get("watch/data?" + $.param({ "namelist": [name] })).then(function (res) {
				if (res.length > 0) container.pagewatchers.push(res[0]);
			})
				.catch(function (err) {
					throw (err);
				});
		},
		removeWatcher: function (index) {
			$.post("watch/stop?name=" + this.pagewatchers[index].name);
			this.pagewatchers.slice(index, 1);
			this.current_tab = 0;
		},
		righthashtags: function (tweet) { //ora deve combaciare con tutti gli hashtag, chiedere se va bene
			if (!filtercounter["Hashtag"] || filtercounter["Hashtag"] == 0) { return true; }
			if (!tweet.entities || !tweet.entities.hashtags) { return false; }
			let contains;
			for (label of this.computedfilters()) {
				if (label.type == "Hashtag") {
					contains = false;
					for (tag of tweet.entities.hashtags) {
						if (tag.text == label.value) {
							if (this.checkedFilters.length == 0)
								return true;
							contains = true;
						}
						else {
							if (this.checkedFilters.length > 0)
								return false;
						}
					}
				}
			};
			return contains;
		},
		rightlocation: function (tweet) { //da debuggare
			if (!filtercounter["Location"] || filtercounter["Location"] == 0) { return true; }
			if (!tweet.place || !tweet.place.bounding_box || !tweet.place.bounding_box.coordinates) { return false; }
			let contains;
			for (label of this.computedfilters()) {
				if (label.type == "Location") {
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
						(coords[0] + coords[1]) / 2,
						(coords[2] + coords[3]) / 2
					]
					if (bbox[0] <= parsedCoords[0] && bbox[1] >= parsedCoords[0] && bbox[2] <= parsedCoords[1] && bbox[3] >= parsedCoords[1]) {
						if (this.checkedFilters.length == 0)
							return true;
						contains = true;
					} else {
						if (this.checkedFilters.length > 0)
							return false;
					}
				}
			}
			return contains;
		},
		rightcontains: function (tweet) {
			if (!filtercounter["Contains"] || filtercounter["Contains"] == 0) { return true; }
			if (!tweet.text) { return false; }
			let contains;
			for (label of this.computedfilters()) {
				contains = false;
				if (label.type == "Contains") {
					if (tweet.text.includes(label.value)) {
						if (this.checkedFilters.length == 0)
							return true;
						contains = true
					} else {
						if (this.checkedFilters.length > 0)
							return false;
					}
				}
			}
			return contains;

		},
		sortTweets: function (setting) {
			if (setting == this.lastSorted) {
				this.tweets = this.tweets.reverse();
			} else {
				this.lastSorted = setting;
				switch (setting) {
					case "Id":
						this.tweets.sort((x, y) => { if (x.id < y.id) return -1; else return 1 });
						break;
					case "Username":
						this.tweets.sort((x, y) => { if (x.user.name < y.user.name) return -1; else return 1 });
						break;
					case "Text":
						this.tweets.sort((x, y) => { if (x.text < y.text) return -1; else return 1 });
						break;
					case "Likes":
						this.tweets.sort((x, y) => { if (x.favorite_count < y.favorite_count) return -1; else return 1 });
						break;
					case "Retweets":
						this.tweets.sort((x, y) => { if (x.retweet_count < y.retweet_count) return -1; else return 1 });
						break;
					case "Date":
						this.tweets.sort((x, y) => { if (Date.parse(x.created_at) < Date.parse(y.created_at)) return -1; else return 1 });
						break;
				}
			}
		},
		computedfilters: function () {
			if (this.checkedFilters.length > 0) {
				let comp = [];
				for (index of this.checkedFilters) {
					comp.push(this.labels[index]);
				}
				return comp;
			}
			return this.labels;
		},

		// graphs
		countHashtags: function (compTweets) {
			var counter = 0;
			var reps = {};

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.entities != undefined && tweet.entities.hashtags != undefined) {

					for (var j in tweet.entities.hashtags) {
						var hashtag = tweet.entities.hashtags[j];
						if (!(hashtag.text.toLowerCase() in reps)) {
							counter++;
							reps[hashtag.text.toLowerCase()] = 0;
						}
						reps[hashtag.text.toLowerCase()]++;
					}
				}
			}
			return [counter, reps];
		},
		postsAtDay: function (compTweets) {
			var posts = {};

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.created_at != undefined) {
					date = tweet.created_at.split(" ")
					day = date[1] + " " + date[2];
					if (!(day in posts))
						posts[day] = 0;
					
					posts[day]++;
				}
			}
			return posts;
		},
		postsPerWeekday: function(compTweets) {
			var posts = {Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0}

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.created_at != undefined) {
					date = tweet.created_at.split(" ")
					day = date[0]
					posts[day]++;
				}
			}
			return posts;
		},
		genColors: function (n) {
			var chartColors = [];
			while (chartColors.length < n) {
				var letters = '0123456789ABCDEF';
				var color = '#';
				for (var i = 0; i < 6; i++) {
					color += letters[Math.floor(Math.random() * 16)];
				}
				chartColors.push(color);
			}
			return chartColors;
		},
		buildDoughnut: function (data) {
			doughnutG = {
				type: 'doughnut',
				data: {
					datasets: [{
						data: Object.values(data[1]),
						backgroundColor: this.genColors(data[0]),
						label: 'Dataset 1'
					}],
					labels: Object.keys(data[1])
				},
				options: {
					responsive: true,
					legend: {
						display: false,
					},
					title: {
						display: true,
						text: 'Hashtags with n. usages'
					},
					animation: {
						animateScale: true,
						animateRotate: true
					}
				}
			};
			var ctx = document.getElementById('doughnut').getContext('2d');
			if(window.myDoughnut != undefined)
				window.myDoughnut.destroy()
			window.myDoughnut = new Chart(ctx, doughnutG);
		},
		buildLine: function(data) {
			var col = this.genColors(7);
			lineG = {
				type: 'line',
				data: {
					labels: Object.keys(data),
					datasets: [{
						label: 'My First dataset',
						backgroundColor: col,
						borderColor: col,
						data: Object.values(data),
						fill: false,
					}]
				},
				options: {
					responsive: true,
					title: {
						display: true,
						text: 'Number of tweets in time'
					},
					tooltips: {
						mode: 'index',
						intersect: false,
					},
					hover: {
						mode: 'nearest',
						intersect: true
					},
					scales: {
						xAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Day'
							}
						}],
						yAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Number'
							}
						}]
					}
				}
			};
			var ctx = document.getElementById('line').getContext('2d')
			if(window.myLine != undefined)
				window.myLine.destroy()
			window.myLine = new Chart(ctx, lineG);
		},
		buildBar: function(data) {
			var col = this.genColors(data.length);
			barG = {
				type: 'bar',
				data: {
					labels: Object.keys(data),
					datasets: [{
						label: "test",
						backgroundColor: col,
						borderColor: col,
						data: Object.values(data),
						fill: true,
					}]
				},
				options: {
					responsive: true,
					title: {
						display: true,
						text: 'Number of tweets in time'
					},
					tooltips: {
						mode: 'index',
						intersect: false,
					},
					hover: {
						mode: 'nearest',
						intersect: true
					},
					scales: {
						xAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Day'
							}
						}],
						yAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Number'
							}
						}]
					}
				}
			};
			var ctx = document.getElementById('bar').getContext('2d')
			if(window.myBar != undefined)
				window.myBar.destroy()
			window.myBar = new Chart(ctx, barG);
		},
		updateGraphs: function (compTweets) {
			var dData = this.countHashtags(compTweets);
			this.buildDoughnut(dData);
			var lData = this.postsPerWeekday(compTweets);
			this.buildLine(lData);
			var bData = this.postsAtDay(compTweets);
			this.buildBar(bData);
		}
	},
	computed: {
		computedtweets: function () {
			//se siamo nel primo tab sono i tweet locali, senno' i tweet del watcher
			let tweets = this.current_tab == 0 ? this.tweets : this.pagewatchers[this.current_tab - 1].tweets;
			this.labels;
			this.checkedFilters;
			let comp = [];
			for (tweet of tweets) {
				if (this.righthashtags(tweet) && this.rightlocation(tweet) && this.rightcontains(tweet) && !(this.onlyLocated && !tweet.geo)) {
					comp.push(tweet);
				}
			};
			return comp;
		},
		computedchecks: {
			get() {
				return this.checkedsettings.length > 0;
			},
			set() { }
		},
		computedwatchers: function () {
			watchers = [];
			for (watcher of this.allwatchers) {
				let is_in = false;
				for (pw of this.pagewatchers) {
					if (watcher.name == pw.name) {
						is_in = true;
						break;
					}
				}
				if (!is_in) {
					watchers.push(watcher);
				}
			}
			return watchers;
		}
	}
})
