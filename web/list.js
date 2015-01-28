seajs.config({
    base: 'http://static.alipayobjects.com/',
    alias: {
		'$'         : 'jquery/jquery/1.7.2/jquery',
		'Backbone'  : 'gallery/backbone/1.1.2/backbone.js',
		'Underscore': 'gallery/underscore/1.6.0/underscore.js',
		"Handlebars": 'gallery/handlebars/1.0.2/handlebars.js',
		"Popup"     : 'arale/popup/1.1.6/popup'
    }
});

seajs.use(['$', 'Underscore', 'Backbone',"Handlebars","Popup","./detail"], function($, _, Backbone,Handlebars,Popup,Detail) {
	Backbone.$ = $;

	var isInApp = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.list;

	$(function(){

		//record detail
		var DetailView = function(){
			var self      = this,
				$detailEl = $(".J_recordDetailOverlay"),
				$mask;

			//init mask
			$mask = $("<div></div>").addClass("overlay_mask").hide();
			$("body").append($mask);

			//bind events
			$(document).on("keyup",function(e){
				if(e.keyCode == 27){ //ESC
					self.hideDetail();
				}
			});

			$mask.on("click",function(e){
				self.hideDetail();
			});

			$(".J_escBtn",$detailEl).on("click",function(e){
				self.hideDetail();
			});

			self.showDetail = function(data){
				Detail.render(data,function(tpl){
					$(".J_recordDetailOverlayContent",$detailEl).html(tpl);
				    $detailEl.show();
				    $mask.show();
				});
			};

			self.hideDetail = function(){
				$detailEl.hide();
				$mask.hide();
			};
		};	
		var detailPanel     = new DetailView();

		//record list
		var RecordModel = Backbone.Model.extend({});
		var RecordList  = Backbone.Collection.extend({
			initialize:function(){
				var self = this;

				self.on("add",function(data){
					new RecordRowView({
						model:data,
						detailPanel : detailPanel
					});
				});

				self.on("reset",function(){
					$(".J_tableBody").empty();
				});
			}
		});

		var RecordRowView = Backbone.View.extend({
			tagName : "tr",
			className:function(){
				return this.model.toJSON().id % 2 ? "row_odd" : "row_even";
			},
			tpl   : $("#main_table_row").html(),
			initialize:function(data){
				var self = this;
				self.model.on("change",self.render,self);
				self.addNewRecord();
				self.detailPanel = data.detailPanel;
			},
			events: {
				click: function(e){
					e.stopPropagation();
					var self = this;
					var detailData = self.model.toJSON();
					if(!isInApp){
						self.detailPanel.showDetail(detailData);
					}else{ 
						window.webkit.messageHandlers.list.postMessage(JSON.stringify(detailData));
					}
				}
			},
			render: function(){
				var self = this,
					data = self.model.toJSON();
				if(!data.statusCode){
					data.statusCode = "-";
				}else{
					self.$el.addClass("record_status_done")
				}

				if(!data.mime){
					data.mime = "-";
				}

				var html = _.template(self.tpl, data);
				self.$el.attr("recordId",data.id).empty().html(html);

				return self;
			},
			addNewRecord:function(){
				$(".J_tableBody").prepend(this.render().$el);
			}
		});

		var recList         = new RecordList();

		//other controllers
		$(".J_clearBtn").on("click",function(e){
			e.stopPropagation();
			e.preventDefault();

			clearLogs();
		});

		$(document).on("keyup",function(e){
			if(e.keyCode == 88 && e.ctrlKey){ // ctrl + x
				clearLogs();
			}
		});

		function clearLogs(){
			recList.reset();
		}

		//pause btn
		var ifPause     = false,
			indicatorEl = $("#J_indicator");
		(function(){
			var statusBtn = $(".J_statusBtn");
			statusBtn.on("click",function(e){
				e.stopPropagation();
				e.preventDefault();

				$(".J_statusBtn").removeClass("btn_disable");
				$(this).addClass("btn_disable");

				if(/stop/i.test($(this).html()) ){
					ifPause = true;
					indicatorEl.fadeOut();
					// indicatorEl.css("visibility","hidden");
				}else{
					ifPause = false;
					indicatorEl.fadeIn();
					// indicatorEl.css("visibility","visible");
				}
			});
		})();

		//[test]render custom menu
		var customMenu     = $("#customMenu").val().split("@@@");

		//data via web socket
		if(!WebSocket){
			alert("WebSocket is required. Please use a modern browser.");
			return;
		}
		var socketPort = $("#socketPort").val(),
			baseUrl     = $("#baseUrl").val(),
			dataSocket  = new WebSocket("ws://" + baseUrl + ":" + socketPort);
		dataSocket.onopen = function(){
			indicatorEl.css("visibility","visible");
		}

		dataSocket.onmessage = function(event){
			if(ifPause) return;
			var data = JSON.parse(event.data);

			var reqDate = new Date(data.startTime);
			data.startTimeStr = reqDate.format("hh:mm:ss") + "";

			var previous;
			if(previous = recList.get(data.id)){
				previous.set(data);	
			}else{
				recList.add(new RecordModel(data),{merge: true});
			}
		}

		dataSocket.onclose = function(e){
		}

		dataSocket.onerror = function(e){
			console.log(e);
			indicatorEl.css("visibility","hidden");
			alert("socket err, please refresh");
		}

	});

	//draggable panel
	(function(){
		var i        = 0;
		var dragging = false,
		pageX = 0;
		$('#dragbar').mousedown(function(e){
			pageX = e.pageX;
			e.preventDefault();
			dragging = true;
			var main = $('.J_recordDetailOverlay');
			var ghostbar = $('<div>',{
				id:'ghostbar',
				css: {
					height: main.outerHeight(),
					top: main.offset().top,
					left: main.offset().left
				}
			}).appendTo('body');

			$(document).mousemove(function(e){
				ghostbar.css("left",e.pageX);
			});
		});

		$(document).mouseup(function(e){
			if(dragging){
				var deltaPageX = e.pageX - pageX;
				
				$('.J_recordDetailOverlay').css("left",pageX + deltaPageX);
				if($('.J_recordDetailOverlay').width()<=100){
					$('.J_recordDetailOverlay').animate({
						'right': $('.J_recordDetailOverlay').width()
					},300,function(){
						$('.J_escBtn').trigger('click');
					});
				}
				pageX = e.pageX;
				$('#ghostbar').remove();
				$(document).unbind('mousemove');
				dragging = false;
			}
		});

	})();

});

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}