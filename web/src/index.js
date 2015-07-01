require("../lib/zepto");
var EventManager    = require('../lib/event'),
	Anyproxy_wsUtil = require("../lib/anyproxy_wsUtil"),
	React           = require("../lib/react");

var WsIndicator = require("./wsIndicator").init(React),
	RecordPanel = require("./recordPanel").init(React);

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


//record panel
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
	eventCenter.addListener("wsGetUpdate",updateRecordSet);

	var Panel = React.render(
		<RecordPanel />,
		document.getElementById("J_content")
	);

	eventCenter.addListener('recordSetUpdated',function(){
		Panel.setState({
			list : recordSet
		});
	});

	eventCenter.addListener("filterUpdated",function(newKeyword){
		Panel.setState({
			filter: newKeyword
		});
	});
})();


//action bar
(function(){
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

	function switchFilterWidget(ifToShow){
		if(ifToShow){
			$(".J_filterSection").show();
			$("#J_filterKeyword").focus();
		}else{
			$(".J_filterSection").hide();
			$("#J_filterKeyword").val("");
		}
	}

	$(".J_toggleFilterBtn").on("click",function(){
		switchFilterWidget( $(".J_filterSection").css("display") == "none" );
	});

	$(".J_filterCloseBtn").on("click",function(){
		switchFilterWidget(false);
	});


	$("#J_filterKeyword").on("change keyup",function(){
		eventCenter.dispatchEvent("filterUpdated",this.value);
	});
})();