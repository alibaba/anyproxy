seajs.config({
	    base: 'http://static.alipayobjects.com/',
	    alias: {
			'$'         : 'jquery/jquery/1.7.2/jquery',
			'Backbone'  : 'gallery/backbone/1.1.2/backbone.js',
			'Underscore': 'gallery/underscore/1.6.0/underscore.js'
	    }
	});

seajs.use(['$','Underscore' ,'Backbone'], function($, _, Backbone) {
	Backbone.$ = $;

	$(function(){

		//record detail
		//backbone太麻烦了，这里手写拉倒..
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

			self.addMask = function(){

			}

			self.showDetail = function(data){
				var tpl = _.template($("#detail_tpl").html() , data);

				$(".J_recordDetailOverlayContent",$detailEl).html(tpl);
			    $detailEl.show();
			    $mask.show();

			    if(data.statusCode){ //if finished
			    	$.ajax({
			    		url:"/body?id=" + data._id,
			    		headers:{
			    			anyproxy_web_req : true
			    		},
			    		type : "GET",
			    		success:function(data){
				    	    $(".J_responseBody", $detailEl).html(data);
				    	}
			    	});

			    }
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
					self.detailPanel.showDetail(detailData);
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
			if(e.keyCode == 88 && e.ctrlKey){ //ctrl x
				clearLogs();
			}else{
				console.log("key up");
				console.log(e);		
			}
		});

		function clearLogs(){
			recList.reset();
		}

		//data via web socket
		var dataSocket = new WebSocket("ws://127.0.0.1:8003");
		dataSocket.onmessage = function(event){
			var data = JSON.parse(event.data);

			var previous;
			if(previous = recList.get(data.id)){
				previous.set(data);	
			}else{
				recList.add(new RecordModel(data),{merge: true});
			}
		}

		dataSocket.onerror = function(e){
			alert("socket err, please refresh");
			console.log(e);
		}

	});

});