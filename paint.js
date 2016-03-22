var SCREEN_WIDTH = 1024;
var SCREEN_HEIGHT = 768;

var paintArea;
var paintAreaContext;

var curPtX = 0;
var curPtY = 0;
var curPtTouched = false;
var prePtX = 0;
var prePtY = 0;
var prePtTouched = false;

var ptCur = new Array();	//描画線上の経由点の配列
var ptHome = new Array();	//描画線上の経由点の本来の位置


/*-------------------------------------
          描画点情報
---------------------------------------*/
function PointInfo(px, py, pkbn){
	//座標
	this.x = px;
	this.y = py;	

	//指示区分（0:始点、1:経由点、2:終点、3:終点塗りつぶし）
	this.kbn = pkbn;	

	//速度
	this.velocityX = 0;
	this.velocityY = 0;

	//加速度
	this.accelX = 0;
	this.accelY = 0;
	
	//摩擦係数
	this.friction = 0.75;
	
	//ptLoop関数の開始
	this.setPtLoop();
}

PointInfo.prototype = {
	// ptLoop関数
	ptLoop: function(){
		var time = 33/1000;
		
		this.x += (this.velocityX * time) + (0.5 * this.accelX * time * time);
		this.y += (this.velocityY * time) + (0.5 * this.accelY * time * time);
		
		this.velocityX = (this.velocityX + (this.accelX * time)) * this.friction;
		this.velocityY = (this.velocityY + (this.accelY * time)) * this.friction;
		
		this.accelX = 0;
		this.accelY = 0;
	},
	
	// ptLoop関数の開始
	setPtLoop: function(){
		var self = this;
		this.timer = setInterval(function(){
			self.ptLoop();
		}, 33);
	},
	
	// 加速度の設定
	setAccel: function(pAccelX, pAccelY){
		this.accelX += pAccelX;
		this.accelY += pAccelY;
	}
}


/*-------------------------------------
          初期処理
---------------------------------------*/
function init(){

	paintArea.addEventListener("mousedown", function(evt){
		prePtTouched = curPtTouched;
		curPtTouched = true;
		setPtMouse(evt);
		setPrePt();
	}, false);
	
	paintArea.addEventListener("mousemove", function(evt){
		setPrePt();
		setPtMouse(evt);
	}, false);
	
	paintArea.addEventListener("mouseup", function(evt){
		prePtTouched = curPtTouched;
		curPtTouched = false
		setPrePt();
		setPtMouse(evt);
	}, false);
	
	paintArea.addEventListener("touchstart",function(evt) {
		evt.preventDefault();
		prePtTouched = curPtTouched;
		curPtTouched = true;
		setPtTouch(evt);
		setPrePt();
	}, false);
	
	paintArea.addEventListener("touchmove", function(evt) {
		evt.preventDefault();
		setPrePt();
		setPtTouch(evt);
	}, false);
	
	paintArea.addEventListener("touchend", function(evt) {
		evt.preventDefault();
		prePtTouched = curPtTouched;
		curPtTouched = false
		setPrePt();
		setPtTouch(evt);
	}, false);
}

/*-------------------------------------
      プレポイント設定
---------------------------------------*/
function setPrePt(){
	prePtX = curPtX;
	prePtY = curPtY;
}
/*-------------------------------------
      ポイント設定（マウス）
---------------------------------------*/
function setPtMouse(evt){
	var rect = paintArea.getBoundingClientRect();
	curPtX = evt.clientX - rect.left;
	curPtY = evt.clientY - rect.top;
}
/*-------------------------------------
      ポイント設定（タッチ）
---------------------------------------*/
function setPtTouch(evt){
	curPtX = evt.changedTouches[0].pageX;
	curPtY = evt.changedTouches[0].pageY;
}


/*-------------------------------------
          初期図形描画
---------------------------------------*/
function setup(){
	ptCur = new Array();
	ptHome = new Array();
	
	for(var i = 0; i < paintdata.length; ++i) {
		ptCur.push(new PointInfo(paintdata[i][1], paintdata[i][2], paintdata[i][0]));
		ptHome.push(new PointInfo(paintdata[i][1], paintdata[i][2], paintdata[i][0]));
	}
}


/*-------------------------------------
          ループ処理
---------------------------------------*/
function loop(){
	for(var i = 0; i < ptCur.length; ++i) {	
		ptCur[i].setAccel((ptHome[i].x - ptCur[i].x)*20, (ptHome[i].y - ptCur[i].y)*20);
		
		var disLimit = 100;
		var dist = Math.sqrt(Math.pow(ptCur[i].x - curPtX, 2) + Math.pow(ptCur[i].y - curPtY, 2));
		if(dist < disLimit){
			var par = (disLimit-dist)/disLimit;
			ptCur[i].setAccel((curPtX - prePtX)*par*300, (curPtY - prePtY)*par*300);
		}
	}
	
	//描画処理
	paintAreaContext.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	paintAreaContext.lineWidth = 1;
	paintAreaContext.lineJoin = "round";
	for(var i = 0; i < ptCur.length; ++i){
		if(ptCur[i].kbn == 0){
			paintAreaContext.beginPath();
			paintAreaContext.moveTo(ptCur[i].x, ptCur[i].y);
		}else{
			paintAreaContext.lineTo(ptCur[i].x, ptCur[i].y);
		}
		if(ptCur[i].kbn == 2){
			paintAreaContext.stroke();
		}
		if(ptCur[i].kbn == 3){
			paintAreaContext.fill();
		}
	}
}


/*-------------------------------------
    ページ読み込み時の処理
---------------------------------------*/
onload = function() {
	paintArea = document.getElementById('paintArea');
	if ( ! paintArea || ! paintArea.getContext ) {
		return false;
	}
	paintAreaContext = paintArea.getContext('2d');
	init();
	setup();
	setInterval(loop, 33);
};

