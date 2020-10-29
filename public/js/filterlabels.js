var filterlabels= new Vue({
	el: "#filterlabels",
	data:{
		labels: [],
		inputfilter: ''
	},
	methods:{
		add: function(){
			this.labels.push(this.inputfilter);
			this.inputfilter="";
			this.labels.sort();
		},
		remove: function(elem){
			let index=0;
			while(index<this.labels.length){
				if(this.labels[index]==elem){
					this.labels.splice(index,1);
					index=this.labels.length;
				}
				index++;
			}
		}
	}
})