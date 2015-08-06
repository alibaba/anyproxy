window.$ = window.jQuery = require("../lib/jquery");

var EventManager    = require('../lib/event'),
	Anyproxy_wsUtil = require("../lib/anyproxy_wsUtil"),
	React           = require("../lib/react");

var WsIndicator = require("./wsIndicator").init(React),
	RecordPanel = require("./recordPanel").init(React),
	Popup       = require("./popup").init(React);

var PopupContent = {
	map    : require("./mapPanel").init(React),
	detail : require("./detailPanel").init(React),
	filter : require("./filter").init(React)
};

var ifPause     = false,
    recordSet   = [];

//Event : wsGetUpdate
//Event : recordSetUpdated
//Event : wsOpen
//Event : wsEnd
var eventCenter = new EventManager();

//merge : right --> left
function util_merge(left,right){
    for(var key in right){
        left[key] = right[key];
    }
    return left;
}

//invoke AnyProxy web socket util
(function(){
	try{
		var ws = window.ws = new Anyproxy_wsUtil({
			baseUrl     : document.getElementById("baseUrl").value,
			port        : document.getElementById("socketPort").value,
			onOpen : function(){
				eventCenter.dispatchEvent("wsOpen");
			},
			onGetUpdate : function(record){
				eventCenter.dispatchEvent("wsGetUpdate",record);
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
		<WsIndicator />,
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
var showPop;
(function(){
	$("body").append('<div id="J_popOuter"></div>');
	var pop = React.render(
		<Popup />,
		document.getElementById("J_popOuter")
	);

	showPop = function(popArg){
		var stateArg = util_merge({show : true },popArg);
		pop.setState(stateArg);
	};
})();

//init record panel
var recorder;
(function(){
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

	function initRecordSet(){
		$.getJSON("/lastestLog",function(res){
			if(typeof res == "object"){
				recordSet = res;
				eventCenter.dispatchEvent("recordSetUpdated");
			}
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

	function showDetail(data){
		showPop({left:"35%",content:React.createElement(PopupContent["detail"], {data:data})});
	}

	//init recorder panel
	recorder = React.render(
		<RecordPanel onSelect={showDetail}/>,
		document.getElementById("J_content")
	);

	initRecordSet();
})();


//action bar
(function(){

	//detect whether to show the filter and map btn
	$.get("/filetree",function(){
		$(".J_filterSection").show();
	});

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

		$(".J_showFilter").on("click",function(){
			showPop({ left:"60%", content:React.createElement(PopupContent["filter"], {onChangeKeyword : updateKeyword})});
		});
	})();

	//map local
	(function(){
		$(".J_showMapPanel").on("click",function(){
			showPop({left:"60%", content:React.createElement(PopupContent["map"],null)});
		});
	})();

	//other button
	(function(){
		$(".J_customButton").on("click",function(){
			var thisEl = $(this),
				iframeUrl = thisEl.attr("iframeUrl");

			if(!iframeUrl){
				throw new Error("cannot find the url assigned for this button");
			}

			var iframeEl = React.createElement("iframe",{src:iframeUrl,frameBorder:0});
			showPop({left:"35%", content: iframeEl });
		});
	})();

})();