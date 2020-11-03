var container = new Vue({
	el: "#container",
	data:{
		labels: [],
		tweets: [],
        stream_on: false,
        local_filters: ["Hashtag","Location"]
	},
	methods:{
		add: function(){
			this.labels.push({
				type: this.$refs.filtertype.value,
				value:this.$refs.filterinput.value}
			);
			this.$refs.streamfilter.value="";
			this.labels.sort();
		},
		remove: function(elem){
			let index=0;
			while(index<this.labels.length){
				if(this.labels[index]==elem){//controlla
					this.labels.splice(index,1);
					index=this.labels.length;
				}
				index++;
			}
		},
		showinfo:function(data){
			console.log(data);
        },
        toggleStream:function(){
            let expr = this.$refs.streamfilter.value;
            //stream
		},
		search: function(){
			let newexpr = this.$refs.searchfilter.value;
			$.get("/search", { expr:newexpr, lim:100}).done(function(newtweets){
				console.log(newtweets);
			});
		}
    },
    computed:{
		computedtweets:function() {
            comp = [];
            for(tweet of this.tweets){
                if(tweet[""] = "ciao") comp.push(tweet);
            }
            return comp;
		}
    }
})