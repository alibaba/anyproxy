window.$ = window.jQuery = require("../lib/jquery");

var EventManager    = require('../lib/event'),
	Anyproxy_wsUtil = require("../lib/anyproxy_wsUtil"),
	React           = require("../lib/react");

var WsIndicator = require("./wsIndicator").init(React),
	RecordPanel = require("./recordPanel").init(React),
	MapPanel    = require("./mapPanel").init(React),
	Detail      = require("./detailPanel").init(React),
	Popup       = require("./popup").init(React),
	Filter      = require("./filter").init(React);

var ifPause     = false,
    recordSet   = [];

//Event : wsGetUpdate
//Event : recordSetUpdated
//Event : wsOpen
//Event : wsEnd
var eventCenter = new EventManager();


//invoke AnyProxy web socket util
(function(){
	try{
		var ws = window.ws = new Anyproxy_wsUtil({
			baseUrl     : document.getElementById("baseUrl").value,
			port        : document.getElementById("socketPort").value,
			onOpen : function(){
				eventCenter.dispatchEvent("wsOpen");
			},
			onGetUpdate : function(content){
				eventCenter.dispatchEvent("wsGetUpdate",content);
			},
			onError     : function(e){
				eventCenter.dispatchEvent("wsEnd");
			},
			onClose     : function(e){
				eventCenter.dispatchEvent("wsEnd");
			}
		});
		window.ws = ws;
		
	}catch(e){
		alert("failed to invoking web socket on this browser");
	}
})();


//websocket status indicator
(function(){
	var wsIndicator = React.render(
		React.createElement(WsIndicator, null),
		document.getElementById("J_indicatorEl")
	);

	eventCenter.addListener("wsOpen",function(){
		wsIndicator.setState({
			isValid : true
		});
	});

	eventCenter.addListener("wsEnd",function(){
		wsIndicator.setState({
			isValid : false
		});
	});	
})();


//init popup
var pop;
(function(){
	$("body").append('<div id="J_popOuter"></div>');
	pop = React.render(
		React.createElement(Popup, null),
		document.getElementById("J_popOuter")
	);
})();


//init record panel
var recorder;
(function(){
	//merge : right --> left
	function util_merge(left,right){
	    for(var key in right){
	        left[key] = right[key];
	    }
	    return left;
	}

	function updateRecordSet(newRecord){
		if(ifPause) return;

		if(newRecord && newRecord.id){
			if(!recordSet[newRecord.id]){
				recordSet[newRecord.id] = newRecord;
			}else{
				util_merge(recordSet[newRecord.id],newRecord);
			}

			recordSet[newRecord.id]._justUpdated = true;
			// React.addons.Perf.start();
			eventCenter.dispatchEvent("recordSetUpdated");
			// React.addons.Perf.stop();
		}
	}

	function showDetail(data){
		pop.setState({
			show: true,
			content : React.createElement(Detail, {data: data}),
			left:"35%"
		});
	}

	eventCenter.addListener("wsGetUpdate",updateRecordSet);

	eventCenter.addListener('recordSetUpdated',function(){
		recorder.setState({
			list : recordSet
		});
	});

	eventCenter.addListener("filterUpdated",function(newKeyword){
		recorder.setState({
			filter: newKeyword
		});
	});

	//init recorder panel
	recorder = React.render(
		React.createElement(RecordPanel, {onSelect: showDetail}),
		document.getElementById("J_content")
	);
})();


//action bar
(function(){
	//clear log
	function clearLogs(){
		recordSet = [];
		eventCenter.dispatchEvent("recordSetUpdated");
	}

	$(document).on("keyup",function(e){
		if(e.keyCode == 88 && e.ctrlKey){ // ctrl + x
			clearLogs();
		}
	});

	var clearLogBtn = $(".J_clearBtn");
	clearLogBtn.on("click",function(e){
		e.stopPropagation();
		e.preventDefault();
		clearLogs();
	});

	//start , pause
	var statusBtn = $(".J_statusBtn");
	statusBtn.on("click",function(e){
		e.stopPropagation();
		e.preventDefault();

		$(".J_statusBtn").removeClass("btn_disable");
		$(this).addClass("btn_disable");

		if(/stop/i.test($(this).html()) ){
			ifPause = true;
		}else{
			ifPause = false;
		}
	});

	//filter
	(function (){
		function updateKeyword(key){
			eventCenter.dispatchEvent("filterUpdated",key);
		}

		var filter = (React.createElement(Filter, {onChangeKeyword: updateKeyword}));
		function showFilter(){
			pop.setState({
				show    : true,
				content : filter,
				left:"50%"
			});
		}

		$(".J_showFilter").on("click",function(){
			showFilter();
		});
	})();

	//map local
	(function(){
		var mapPanel = (React.createElement(MapPanel, null));
		function showMap(){
			pop.setState({
				show : true,
				content : mapPanel,
				left:"40%"

			})
		}

		$(".J_showMapPanel").on("click",function(){
			showMap();
		});
	})();

})();