var SCREEN_WIDTH = 1024;
var SCREEN_HEIGHT = 768;

var paintArea;
var paintAreaContext;
var ptX = new Array(0, 0, 0, 0, 0);
var ptY = new Array(0, 0, 0, 0, 0);

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
	
	//loop関数の開始
	this.startLoop();
}

PointInfo.prototype = {
	loop: function(){
		
		//経過時間（秒）
		var time = 33/1000;
		
		//座標：(現在の速度 * 経過時間) + (0.5 * 加速度 * 経過時間 * 経過時間)
		this.x += (this.velocityX * time) + (0.5 * this.accelX * time * time);
		this.y += (this.velocityY * time) + (0.5 * this.accelY * time * time);
		
		//速度：(現在の速度 + (加速度 * 経過時間)) * 摩擦係数
		this.velocityX = (this.velocityX + (this.accelX * time)) * this.friction;
		this.velocityY = (this.velocityY + (this.accelY * time)) * this.friction;
		
		//加速度を初期化
		this.accelX = 0;
		this.accelY = 0;
	},
	
	setKasokudo: function(pAccelX, pAccelY){
		//現在の加速度の値に指定の値を加算する
		this.accelX += pAccelX;
		this.accelY += pAccelY;
	},
	
	setKasokudoByPolar: function(r, dire){
		//現在の加速度の値に指定の値を加算する
		//渡される値は大きさと向きなので、それをx方向とy方向に変換する
		this.accelX += r*Math.cos(dire);
		this.accelY += r*Math.sin(dire);
	},
	
	startLoop:function(){
		//loop関数を33ミリ秒ごとに繰り返すように設定、開始
		var kore = this;

		this.timer = setInterval(function(){
			kore.loop();
		}, 33);

	}
}



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

/*-------------------------------------
          初期処理
---------------------------------------*/
function init(){

	paintArea.addEventListener("mousedown", function(evt){
		var rect = paintArea.getBoundingClientRect();

		prePtTouched = curPtTouched;
		prePtX = curPtX;
		prePtY = curPtY;
		curPtTouched = true;
		curPtX = evt.clientX - rect.left;
		curPtY = evt.clientY - rect.top;
		ptX[0] = evt.clientX - rect.left;
		ptY[0] = evt.clientY - rect.top;
		onPressed();
	}, false);
	
	paintArea.addEventListener("mousemove", function(evt){
		var rect = paintArea.getBoundingClientRect();
		
		prePtX = curPtX;
		prePtY = curPtY;
		curPtX = evt.clientX - rect.left;
		curPtY = evt.clientY - rect.top;
		ptX[0] = evt.clientX - rect.left;
		ptY[0] = evt.clientY - rect.top;
	}, false);
	
	paintArea.addEventListener("mouseup", function(evt){
		var rect = paintArea.getBoundingClientRect();

		prePtTouched = curPtTouched;
		prePtX = curPtX;
		prePtY = curPtY;
		curPtTouched = false
		curPtX = evt.clientX - rect.left;
		curPtY = evt.clientY - rect.top;
		ptX[0] = evt.clientX - rect.left;
		ptY[0] = evt.clientY - rect.top;
	}, false);
	
	paintArea.addEventListener("touchstart",function(evt) {
		evt.preventDefault();

		prePtTouched = curPtTouched;
		prePtX = curPtX;
		prePtY = curPtY;
		curPtTouched = true;
		curPtX = evt.changedTouches[0].pageX;
		curPtY = evt.changedTouches[0].pageY;
		for(var i=0; i < evt.touches.length; ++i){
			ptX[i] = evt.touches[i].pageX;
			ptY[i] = evt.touches[i].pageY;
		}
		onPressed();
	}, false);
	
	paintArea.addEventListener("touchmove", function(evt) {
		evt.preventDefault();

		prePtX = curPtX;
		prePtY = curPtY;
		curPtX = evt.changedTouches[0].pageX;
		curPtY = evt.changedTouches[0].pageY;
		for(var i=0; i < evt.touches.length; ++i){
			ptX[i] = evt.touches[i].pageX;
			ptY[i] = evt.touches[i].pageY;
		}
	}, false);
	
	paintArea.addEventListener("touchend", function(evt) {
		evt.preventDefault();

		prePtTouched = curPtTouched;
		prePtX = curPtX;
		prePtY = curPtY;
		curPtTouched = false
		curPtX = evt.changedTouches[0].pageX;
		curPtY = evt.changedTouches[0].pageY;
	}, false);
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
		//自分の場所に帰る
		ptCur[i].setKasokudo((ptHome[i].x - ptCur[i].x)*20, (ptHome[i].y - ptCur[i].y)*20);
		
		var maxDist = 100;
		var dist = Math.sqrt(Math.pow(ptCur[i].x - curPtX, 2) + Math.pow(ptCur[i].y - curPtY, 2));
		if(dist < maxDist){
			var par = (maxDist-dist)/maxDist;	//指と点が近ければ１、遠ければ０
			ptCur[i].setKasokudo((curPtX - prePtX)*par*300, (curPtY - prePtY)*par*300);
		}
	}
	
	//描画
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

function onPressed(){
	//「以前の指の場所」を初期化（今の指の場所に）して
	prePtX = curPtX;
	prePtY = curPtY;
	
}

