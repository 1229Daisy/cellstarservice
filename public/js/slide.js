/*	window.onload = function() {
	var oActionBlock = document.getElementById('action-block');
	var oActionBar = document.getElementById('action-bar');
	var oScrollBar = document.getElementById('scroll-bar');
	var oShowAmount = document.getElementById('showAmount').getElementsByTagName('input')[0];
	var length = 550;

	clickSlide(oActionBlock, oActionBar, oScrollBar, 300, length, oShowAmount);
	drag(oActionBlock, oActionBar, 300, length, oShowAmount);
	addScale(60, 300, length, oScrollBar);
	inputBlur(oActionBlock, oActionBar, length, oShowAmount);
}		*/


function SlideBar(data){
	var _this = this;
	var oActionBlock = document.getElementById(data.actionBlock);
	var oActionBar = document.getElementById(data.actionBar);
	var oSlideBar = document.getElementById(data.slideBar);
	var barLength = data.barLength;
	var interval = data.interval;
	var maxNumber = data.maxNumber;
	_this.drag(oActionBlock, oActionBar, maxNumber, barLength);

	
}

SlideBar.prototype = {
	
	/*	检查target(确认移动方向)并滑动	*/
	checkAndMove : function(actionBlock, actionBar, target){
		
		if(target > actionBar.offsetWidth){
			actionBarSpeed = 8;		//actionBar的移动度和方向
		}
		else if(target == actionBar.offsetWidth){
			return;
		}
		else if(target < actionBar.offsetWidth){
			actionBarSpeed = -8;
		}
		
		var timer = setInterval(function(){
			var actionBarPace = actionBar.offsetWidth + actionBarSpeed;

			if(Math.abs(actionBarPace - target) < 10){
				actionBarPace = target;
				clearInterval(timer);
			}
			actionBar.style.width = actionBarPace + 'px';
			actionBlock.style.left = actionBar.offsetWidth - (actionBlock.offsetWidth / 2) + 'px';
		},30);
	},


	/*	鼠标按着拖动滑动条	*/
	drag : function(actionBlock, actionBar, total, barLength, showArea){
		/*	参数分别是点击滑动的那个块,滑动的距离,滑动条的最大数值,显示数值的地方(输入框)	*/
		actionBlock.onmousedown = function(ev) {
			var ev = ev || event;
			var thisBlock = this;
			var disX = ev.clientX;
			var currentLeft = thisBlock.offsetLeft;

			document.onmousemove = function(ev) {
				var ev = ev || event;
				var left = ev.clientX - disX;

				if (currentLeft + left <= (barLength - thisBlock.offsetWidth / 2 ) && currentLeft + left >= 0 - thisBlock.offsetWidth / 2) {
					thisBlock.style.left = currentLeft + left + 'px';
					console.info(thisBlock.style.left)
					actionBar.style.width = currentLeft + left + (actionBlock.offsetWidth / 2) + 'px';
					var	value = (actionBar.offsetWidth / barLength * total).toFixed(2);
				
					//var rishlevel=getElementById("rishlevel").innerText
					var vdata=(1.37*value-2).toFixed(2)
					document.getElementById("mval").innerText=vdata;
					console.info(vdata)
					 if(vdata<=0.85)document.getElementById("rec").innerText="健康";
					 else if(vdata>0.85 && vdata<2.4)document.getElementById("rec").innerText="低风险";
					 else if(vdata>=2.4 && vdata<4.0)document.getElementById("rec").innerText="高风险";
					 else if(vdata>=4.0 && vdata<5.4)document.getElementById("rec").innerText="确诊";
				}
				return false;
			}

			document.onmouseup = function(e) {
				document.onmousemove = document.onmouseup = null;
			}
			return false;
		}
	},

	getStyle : function(obj, attr){
		return obj.currentStyle?obj.currentStyle[attr]:getComputedStyle(obj)[attr];
	}
}