/* Written by Ryan Wilson */
/* https://github.corp.dyndns.com/rwilson/Dove */
(function($){
	function Dove(settings){
		var isDragging = false;
		var bird = this;
		this.settings = settings;
		this.data = settings.data;
		this.isRendered = false;
		this.canvas = $("#" + settings.renderid)[0];
		this.jQueryObject = $("#" + settings.renderid);
		this.jQueryObject.mousedown(function(event){
			//console.log(event);
		})
		this.stopLiveLoop = false;
		this.xvismin = 0;
		this.xvismax = 0;
		this.yvismin = 0;
		this.yvismax = 0;
	}
	$.fn.dove = function(options){
		var element = this;
		var settings = $.extend({
			renderid: element[0].id,
			title: 'test',
			data: [],
			yAxisMin: '',
			yAxisMax: '',
			lineWidth: 1.5,
			colors: ["#00bfff", "#000000", "#228b22", "8a2be2", "#800000", "#ff0000", "#ffa500"],
			legend: true,
			axisPaddingBot: 50,
			axisPaddingLeft: 50,
			axisPaddingTop: 50,
			axisPaddingRight: 50,
			backgroundLineColor: 'black',
			yAxisLabel: 'Count',
			xAxisLabel: 'Time',
			xAxisLabelNum: 5,
			yAxisLabelNum: 5,
			xAxisType: 'datetime',
			events: {
				onLoad: function(){}
			},
			liveData: {
				funct: false,
				interval: false,
				removeOldest: true
			},
			onload: function(){}
		}, options);

		if(this.is("canvas")){
			var bird = new Dove(settings);
			element.data("cage", bird);
			bird.drawGraph();
		}else{
			console.log("Please only use a canvas with this!");
		}

	};
	Dove.prototype.addData = function(data){
		for(var i = 0; i < data.length; i++){
			for(var x = 0; x < this.data.length; x++){
				if(data[i].target = this.data[i].target){
					this.data[i].datapoints.push.apply(this.data[i].datapoints, data[i].datapoints);
				}
			}
		}
		this.drawGraph();
	}
	function handleMouseClick(event, settings){
		var dove = $("#" + settings.renderid);
		if(event.offsetX > settings.axisPaddingLeft && event.offsetX < (dove[0].width - settings.axisPaddingRight) &&
			event.offsetY > settings.axisPaddingTop && event.offsetY < (dove[0].height-settings.axisPaddingBot)){
			console.log("in");
		}
		else{
			console.log("out");
		}
	}
	Dove.prototype.getVisibleData = function(data){
		/* returns data only within the objects visible  range
		   as determined by zooming, etc */
		var newdata = jQuery.extend(true, [], data);
		console.log(newdata[0].datapoints);
		for(var i = 0; i < data.length; i++){
			newdata[i].datapoints = this.dataInRange(newdata[i].datapoints);
		}
		return newdata;
	}
	Dove.prototype.dataInRange = function(series){
		var series = jQuery.extend(true, [], series);
		console.log(series);		
		var newSeries = Array();
		for(var i = 0; i < series.length; i++){
			if(series[i][0] > this.xvismin && series[i][0] < this.xvismax){
				newSeries.push(series[i]);
			}
		}
		return newSeries;

	}
	Dove.prototype.drawGraph = function(){
		var canvas = this.canvas;
		var data = this.data;
		//data = this.getVisibleData(data);
		var settings = this.settings;
		var context = canvas.getContext('2d');		
		var dataMax = 0;
		var dataMin = settings.data[0].datapoints[0][0];
		var dataxlen = 0;
		var colorIndex = 0;
		context.clearRect(0,0, canvas.width, canvas.height);
		
		for(var i = 0; i < data.length; i++){
			data[i].datapoints.sort(compareArray);
		}

		for(var i = 0; i < data.length; i++){
			for(var x = 0; x < data[i].datapoints.length; x++){
				if(data[i].datapoints[x][1] > dataMax){
					dataMax = data[i].datapoints[x][1];
				}
				if(data[i].datapoints[x][1] < dataMin){
					dataMin = data[i].datapoints[x][1];
				}
			}
		}
		//Need something other than 0 to initialize
		var xmin = data[0].datapoints[0][0];
		var xmax = 0;
		for(var i = 0; i<data.length; i++){
			for(var x = 0; x < data[i].datapoints.length; x++){
				if(data[i].datapoints[x][0] < xmin){
					xmin = data[i].datapoints[x][0];
				}
				if(data[i].datapoints[x][0] > xmax){
					xmax = data[i].datapoints[x][0];
				}
			}
		}
		var rangeofx = xmax - xmin;
		
		graphMax = nextHighestMultiple(dataMax);
		var width = canvas.width;
		var height = canvas.height;
		var adjustedHeight = height - (settings.axisPaddingBot + settings.axisPaddingTop);

		var xinterval = (width-(settings.axisPaddingLeft + settings.axisPaddingRight)) / (rangeofx);
		
		/* -------------------------------*/
		context.save();
		context.translate((width/2), 25);
		context.font = '16pt Arial';
		context.textAlign = 'center';
		context.fillText(settings.title, 0, 0);
		context.restore();
		context.save();
		/* Draw the labels for the axis */
		context.translate(settings.axisPaddingLeft / 3, adjustedHeight/2);
		context.rotate(Math.PI * -90/180);
		context.fillText(settings.yAxisLabel, 0, 0);
		context.restore();
		context.save();
		context.translate((width/2), (height-settings.axisPaddingBot) + (settings.axisPaddingBot)/1.5);
		context.fillText(settings.xAxisLabel, 0, 0);
		context.restore();
		/* ----------------------------- */


		var adjustedx = Array();
		for(var i = 0; i < data.length; i++){
			adjustedx.push(adjustedXValues(data[i].datapoints, xmin, xmax));
		}

		this.drawAxisLabel(xmin, xmax, width, height, dataMin, dataMax, graphMax);

		/* Here is the magic */
		var eachheight = adjustedHeight / (graphMax - dataMin)
		for(var i = 0; i < data.length; i++){
			context.beginPath(); 
			adjusted = adjustedx[i];
			context.moveTo((adjusted[data[i].datapoints[0][0]] * xinterval) + settings.axisPaddingLeft,  adjustedHeight + settings.axisPaddingTop - ((data[i].datapoints[0][1] - dataMin) * eachheight));
			for(var x = 1; x < data[i].datapoints.length; x++){
				var point = data[i].datapoints[x];
				var relativeHeight = (adjustedHeight * (dataMax / graphMax)) / (dataMax / point[1]);
				context.lineTo((adjusted[point[0]] * xinterval) + settings.axisPaddingLeft, adjustedHeight + settings.axisPaddingTop - ((point[1] -dataMin) * eachheight));
			}
			context.strokeStyle = settings.colors[colorIndex];
			colorIndex++;
			if(colorIndex >= settings.colors.length){
				colorIndex = 0;
			}
			context.lineWidth = this.settings.lineWidth;
			context.stroke();
		}
		/* ----------------*/
		drawAxis(context, settings, width, height);
		this.isRendered = true;
		if(this.stopLiveLoop == false){
			this.stopLiveLoop = true;
			this.settings.events.onLoad();
		}
	};
/*
	Dove.prototype.handleLiveData = function(){
		this.stopLiveLoop = true;
		var dove = this;
		setInterval(function(){
			var newData = dove.settings.liveData.funct();		
			for(var i = 0; i < dove.data.length; i++){
				for(var x = 0; x < newData.length; x++){
					if(newData[x].target == dove.data[i].target){
						if(dove.data[i].target == newData[x].target){
							if(dove.settings.liveData.removeOldest == true){
								dove.data[i].datapoints.shift();						
							}
							dove.data[i].datapoints.push(newData[x].datapoints[0]);
						}
					}
				}
			}
			dove.drawGraph();
		}, dove.settings.liveData.interval);
	}
*/

	/* Various Rendering Functions */

	Dove.prototype.drawAxisLabel = function(xmin, xmax, width, height, dataMin, dataMax, graphMax){
		var context = this.canvas.getContext('2d');
		var	settings = this.settings;	
		context.textAlign = 'center';
		//draw x labels
		var xlabelinterval = (width - (settings.axisPaddingRight + settings.axisPaddingLeft)) / (settings.xAxisLabelNum - 1);
		for(var i = 0; i < settings.xAxisLabelNum; i++){
			var label = xmin + ( (xmax-xmin)/(settings.xAxisLabelNum -1 )) * i;
			if(settings.xAxisType == 'datetime'){
				label = new Date(label * 1000);
				label = label.toLocaleTimeString();
			}
			context.fillText(String(label), (xlabelinterval * i) + settings.axisPaddingLeft, (height - settings.axisPaddingBot) + 15);
		}
		//draw y axis labels
		var ylabelinterval = (height - (settings.axisPaddingTop + settings.axisPaddingBot)) / (settings.yAxisLabelNum - 1);
		var ylabeljump = (graphMax - dataMin) / (settings.yAxisLabelNum - 1);
		for(var i = 0; i < settings.yAxisLabelNum; i++){
			var reversei = settings.yAxisLabelNum - i;
			var label = dataMin + (ylabeljump * i);
			label = Math.round(label * 100)/100;
			context.fillText(String(label), (settings.axisPaddingLeft - 15), (settings.axisPaddingTop + (ylabelinterval * (reversei-1))));
		}

	}
	/* Array of type [] by their x value. (for time sorting) */
	function compareArray(a, b){
		if(a[0] < b[0]){
			return -1;
		}
		if(a[0] > b[0]){
			return 1;
		}
		return 0;
	}
	function adjustedXValues(values, xmin, xmax){
		/* Creates an array that gives you the respective drawing x value */
		var adjusted = [];
		for(var i = 0; i < values.length; i++){
			adjusted[values[i][0]] = values[i][0]-xmin;
		}
		return adjusted;
	}
	function drawAxis(context, settings, width, height){
		context.beginPath();
		context.moveTo(settings.axisPaddingLeft, height - settings.axisPaddingBot);
		context.lineTo(width - settings.axisPaddingRight, height - settings.axisPaddingBot);
		context.strokeStyle = settings.backgroundLineColor;
		context.stroke();

		context.beginPath();
		context.moveTo(settings.axisPaddingLeft, height - settings.axisPaddingBot);
		context.lineTo(settings.axisPaddingLeft, settings.axisPaddingTop);
		context.strokeStyle = settings.backgroundLineColor;
		context.stroke();
	}
	function nextHighestMultiple(dataMax){
		var maxString = String(dataMax);
		var tempmax = String(Math.round(dataMax));
		var msf = maxString.charAt(0);
		var msfn = Number(msf);
		msfn++;
		var graphMaxString = '';
		graphMaxString = graphMaxString + msfn;
		for(var i = 1; i<tempmax.length; i++){
			graphMaxString = graphMaxString + '0';
		}
		var graphMax = Number(graphMaxString);
		return graphMax;
	}

} (jQuery));