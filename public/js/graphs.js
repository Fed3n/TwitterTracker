var graphs = new Vue({
    el: "#graphs",
    data: {
        //when tweet != null tweet informations shown on modal
		tweet: null,
		//when errormsg != null modal shows the error message
        errormsg: "",
        //charts configuration
        config: {
            type: '',
            data: {
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    label: ''
                }],
                labels: []
            },
            options: {
                responsive: true,
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: ''
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        },
        chartColors: {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)'
        }
    },
    methods: {
        showStats: function(){
            this.show();
        },
        showError: function(msg){
			this.reset();
			this.errormsg=msg;
			this.show();
		},
		//once the modal info are set, the modal can be shown
		show: function(){
			$("#graphs").modal();
		}
    }
})