var tweetslist= new Vue({
	el: "#tweetslist",
	data:{
		tweets: []
	},
	methods:{
		showinfo:function(data){
			console.log(data);
		}
	}
})