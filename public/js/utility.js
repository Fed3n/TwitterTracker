function importfile(){
	var file = $('#import')[0].files[0];
  	console.log(file);
  	if (file <= 0) {
    	return false;
  	}
  	var fr = new FileReader();
  	fr.onload = function(e) { 
		console.log(e);
		container.appendtweets(JSON.parse(e.target.result));
		container.tweets.sort();
  	}
  	fr.readAsText(file);
}

function exportfile(){
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(container.computedtweets));
	var downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download", "tweet_analytics" + ".json");
	document.body.appendChild(downloadAnchorNode);
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}  

$(document).ready(function(){
	$("#import").change(importfile);
	$("#importButton").click(()=>{$("#import").click();});
	$("#export").click(exportfile);
	$("#togglesettings").click(function(){$("#settings").toggle("slow")});
	$("#clearTweets").click(()=>{if(confirm("Do you want to clear all the tweets?")){container.tweets=[];}});
	$("#mapbutton").click(()=>{modal.showMap();});
	$('.dropdown-menu').click((e)=>{e.stopPropagation();});
	map.SetMap("map");

})