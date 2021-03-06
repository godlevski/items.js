// --- Handy protos extension ---
String.prototype.stringify = function(){
	return this.replace(/\s{1,}/g,' ').replace(/^\ *|\ *$/g,'');
}

// --- ITEMS ---

var Items = function(){
	this.index = new Items.index;
	this.push.apply(this, arguments);
	return this;
};

// -- Handies

Items.handies = {};

Items.handies.valuate = function(input, values){
	
	if(typeof input == 'string'){
		var variables = input.match(/\{{2}[^\}]*\}{2}/g);

		if (!variables) return input;

		for (var i = 0; i < variables.length; i++) {
			var value = values[ variables[i].replace(/\{|\}/g,'') ];
			input = input.replace(variables[i], typeof value != 'undefined' ? value : '');
		};
	}

	else if(typeof input == 'object'){
		for (var key in input){
			if(input.hasOwnProperty(key)){
				if (typeof input[key] == 'string'){
					input[key] = arguments.callee.call(this, input[key], values);
				}
			}
		}
	}

	return input;
}

Items.handies.isObject = function(test){
	return (typeof test == 'object' &&
			!(test instanceof Array));
}

Items.handies.extendProto = function(){
	for (var i = 0; i < arguments.length; i++) {
		if( arguments[i].hasOwnProperty('prototype') ){
			Items.handies.extend.call(this.prototype, arguments[i].prototype)
		}
	};
	return this;
}

Items.handies.extend = function(){
	var target = this, deep = false;

	for (var i = 0; i < arguments.length; i++) {
		
		if (typeof arguments[i] == 'boolean'){
		
			deep = arguments[i];
		
		} else if( Items.handies.isObject(arguments[i]) ||
				arguments[i] instanceof Array){
			
			for(var key in arguments[i]){
				if( !arguments[i].hasOwnProperty(key) ) continue;


				if( deep &&
					arguments[i][key] instanceof Items ){

					target[key] = arguments.callee.call(new Items, deep, arguments[i][key]);
				}
				else if( deep &&
					arguments[i][key] instanceof Items.index ){

					target[key] = arguments.callee.call(new Items.index, deep, arguments[i][key]);
				}
				else if( deep &&
					arguments[i][key] instanceof Items.group ){

					target[key] = arguments.callee.call(new Items.group, deep, arguments[i][key]);
				}
				else if( deep &&
					arguments[i][key] instanceof Items.item ){

					target[key] = arguments.callee.call(new Items.item, deep, arguments[i][key]);
				}
				else if( deep &&
					arguments[i][key] instanceof Items.collection ){

					target[key] = arguments.callee.call(new Items.collection, deep, arguments[i][key]);
				}
				else if( deep &&
					Items.handies.isObject(arguments[i][key]) ){

					target[key] = arguments.callee.call({}, deep, arguments[i][key]);
				}
				else if(deep &&
						arguments[i][key] instanceof Array){

					target[key] = arguments.callee.call([], deep, arguments[i][key]);
				}
				else {
					
					target[key] = arguments[i][key];
				}
			}
		}
	};

	return target;
}

// -- Collection: generic arraylike object model

Items.collection = function(){};

Items.collection.prototype = {
	
	reverse: Array.prototype.reverse,
	sort: Array.prototype.sort,

	pop: Array.prototype.pop,
	shift: Array.prototype.shift,
	unshift: Array.prototype.unshift,
	
	splice: Array.prototype.splice, 
	push: function(){
		Array.prototype.push.apply(this, arguments);
		return this;
	},
	
	join: Array.prototype.join,
	slice: Array.prototype.slice,

	concat: function(){
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i] && arguments[i].length){
				for (var ii = 0; ii < arguments[i].length; ii++) {
					this.push( arguments[i][ii] );
				};
			}
		};
		return this;
	},
	
	indexOf: function(key){
		for (var i = 0; i < this.length; i++) {
			if( this[i] == key ) return i;
		};
		return -1;
	},

	forEach: function(fn){
		if( typeof fn !== 'function' ) return;
		for (var i = 0; i < this.length; i++) {
			fn(this[i], i, this);
		};
		return this;
	}
}

// -- Members
// our little club

Items.members = [];

// -- Items

Items.handies.extendProto.call( Items, Items.collection )

Items.prototype.push = function(){
	for (var i=0; i<arguments.length; i++){
		if( arguments[i] instanceof Items.item ||
			arguments[i] instanceof Items.group ){
			Array.prototype.push.call(this, arguments[i]);
		} 
		else if(Items.handies.isObject(arguments[i])){
			Array.prototype.push.call(this, new Items.item(arguments[i]))
		}
		else if(arguments[i] instanceof Array){
			Array.prototype.push.call(this, Items.group.apply(new Items.group, arguments[i]))
		}
	}
	return this;
}

Items.prototype.indexate = function(){
	var items, options;

	// check arguments

	for (var i = 0; i < arguments.length; i++) {
		if (arguments[i] instanceof Items ||
			arguments[i] instanceof Items.group){
			items = arguments[i];
		}
		else if( arguments[i] instanceof Items.index.options){
			options = arguments[i];
		}
	};

	// clear index

	var items = items ? items : this,
		options = options ? options : items.index.options,
		index = items.index.clear().concat(options.indexMap),
		sample = options.extended ? items.length : 1;
	
	// define keys

		keys = {},
		collectKeys = function(item, prefix){
			var keys = {}, 
				prefix = prefix ? prefix : '';

			for (var key in item){
				
				if (item.hasOwnProperty(key) &&
					!(key*1) && key*1 != 0 &&
					!key.match(options.exclude)){

					if (item[key] instanceof Items ||
						item[key] instanceof Items.group ||
						item[key] instanceof Array ){

						for (var i = 0; i < sample; i++) {

							// create range variable if doesn't exist

							var rangeVar = '$'+key+'~range',
								defRange = options.defRange;

							if (!index[rangeVar]){

								switch (defRange){
									case 'all':
										index[rangeVar] = '1-'+item[key].length;
										break;
									default:
										index[rangeVar] = defRange;
										break;
								}
							}

							// collect keys

							Items.handies.extend.call( keys, 
								collectKeys(item[key][i], prefix+'['+key+']['+rangeVar+']') );

							// if array with values

							if (typeof item[key][i] == 'string' ||
								typeof item[key][i] == 'number'){

								keys[ prefix+'['+key+']['+rangeVar+']' ] = true;
							}
						};						
					}

					else if(item[key] instanceof Items.item ||
							typeof item[key] == 'object'){

						Items.handies.extend.call( keys, 
								collectKeys(item[key], prefix+'['+key+']') );

					}

					else {
						keys[ prefix+'['+key+']'] = true;
					}
				}
			}

			return keys;
		};

	// collect keys

	items.forEach(function(item, i){
		if (i < sample){
		
			if (options.prefixes){
				var prefixes = options.prefixes.split(',');

				for (var p = 0; p < prefixes.length; p++) {
					
					if (item[prefixes[p]]){

						if (typeof item[prefixes[p]] == 'string' ||
							typeof item[prefixes[p]] == 'boolean' ||
							typeof item[prefixes[p]] == 'number' ){

							keys[ '['+prefixes[p]+']' ] = true;
						} 
						else {
							Items.handies.extend.call( keys, 
								collectKeys(item[prefixes[p]], '['+prefixes[p]+']') );	
						}
					}

				};
			}
			else {

				Items.handies.extend.call( keys, 
					collectKeys(item) );

			}
		}
	});

	// apply keys

	for (var key in keys){
		if (keys.hasOwnProperty(key) &&
			!key.match(options.excludeAll)){

			// check if not yet present
			if(index.indexOf(key) <0){

				// get closest postion marked to fill in
				var pos = index.indexOf('*');

				// set key to pos
				if(pos>=0){
					index[pos] = key;
				}
				// or append to the end
				else {
					index.push( key );
				}
			}
		}
	}
	

	return items;
}

Items.prototype.toText = function(){ // items, options, indexOptions, index
	var items, options, indexOptions, index,
		text = '';

	// check arguments

	for (var i = 0; i < arguments.length; i++) {
		
		if(arguments[i] instanceof Items.index){
			index = arguments[i];
		}
		else if(arguments[i] instanceof Items.index.options){
			indexOptions = arguments[i];
		}
		else if( typeof arguments[i] == 'object' ){
			options = arguments[i];
		}

	};

	// apply arguments

	items = this;
	
	index = index ? index : indexOptions ? items.indexate( indexOptions ).index : items.index.length ? items.index : items.indexate().index;
	index = index.flattenRanges();

	options = Items.handies.extend.call({
		start: '',
		rowStart: '',
		rowEnd: '\n',
		cellStart: '',
		cellEnd: '\t',
		end: '',
		extendCell: function(cellHtml, ntimes){
			ntimes = ntimes ? ntimes : 1;

			for (var i = 0; i < ntimes; i++) {
				cellHtml += this.cellStart+this.cellEnd;
			};
			
			return cellHtml;
		},
		onRow: function(rowHtml, item){return rowHtml},
		onCell: function(cellHtml, cell){return cellHtml},
		showHeader: true,
		showBody: true,
		appendTitle: '{{name}}'
	}, options)

	// make header

	if (options.showHeader){
		var header = [],
			title = Items.handies.valuate(options.appendTitle, items),
			depth = 1;

		// check depth
		for (var k = 0; k < index.length; k++) {
			var thisDepth = index[k].split('[').length-1;

			if (depth < thisDepth) depth = thisDepth;
		}

		// create levels
		for (var l = 0; l < depth; l++) {
			
			header.splice(0,0,[])
		};

		// for each key in index
		for (var k = 0; k < index.length; k++) {
			var keyValues = index[k].replace(/^\[|\]/g, '').split('['),
				l = header.length-1;

			// fill in values in to level's cells accordingly
			for (var sk = keyValues.length-1; sk >= 0; sk--, l--) {
				
				// extend previous cell if its value is the same
				// and level is higher then ground
				if( header[l].prevVal == keyValues[sk] && l < header.length-1 ){
					
					header[l][header[l].prevPos] = options.extendCell(header[l][header[l].prevPos]);
				}
				else {

					header[l][k] = options.cellStart+keyValues[sk]+options.cellEnd;

					// save last assigned position and value
					header[l].prevPos = k;
					header[l].prevVal = keyValues[sk];
				};
			};

			// fill in left levels with blank cells
			while (l>-1){
				header[l][k] = options.cellStart+options.cellEnd;
				// save last assigned position and value
				header[l].prevPos = k;
				header[l].prevVal = keyValues[sk];
				l--;
			}
		};

		// append title if exist
		if (title){
			var cell = options.cellStart + title + options.cellEnd;
			
			// extend cell 'n' times
			cell = options.extendCell(cell, header[header.length-1].length-1);
			
			text += options.rowStart+cell+options.rowEnd;
		}

		// append header

		for (var l = 0; l < header.length; l++) {
			text += options.rowStart+header[l].join('')+options.rowEnd;	
		};
		
		// valuate header

		text = Items.handies.valuate(text, items);
	}

	if (options.showBody){
		for (var i = 0; i < items.length; i++) {
			var row = options.rowStart;

			for (var k = 0; k < index.length; k++) {
				var keyValues = index[k].replace(/^\[|\]/g, '').split('['),
					value = items[i];

				for (var v = 0; v < keyValues.length; v++) {
					if(value === undefined) break;

					value = value[keyValues[v]];
				};

				if (value === undefined){
					row += options.onCell( options.cellStart+options.cellEnd, '');
				}
				else if (items[i] instanceof Items.group){
					text += Items.group.toText( options, indexOptions );
				}
				else {
					row += options.onCell( options.cellStart+value+options.cellEnd, value );
				};
			};

			row += options.rowEnd;
			row = options.onRow(row, items[i]);

			text += Items.handies.valuate(row, items[i]);
		};

	}

	return text;
}

Items.prototype.toFile = function(filename, content){ //filename, content, options, indexOptions, index
	var filename = typeof arguments[0] == 'string' ? arguments[0] : 'Items-Compilation.txt',
		content = 'data:text;charset=utf-8,' + ( content ? content : encodeURIComponent(this.toText.apply(this, arguments)) ),
		link = document.createElement('a');

	link.setAttribute('download', filename);
	link.setAttribute('href', content);
	link.setAttribute('target', '_blank');
	link.click();

	return this;
}

Items.prototype.toExcel = function(){
	var items = this,
		date = new Date,
		xml = '<?xml version="1.0"?>\
		<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\
			xmlns:o="urn:schemas-microsoft-com:office:office"\
			xmlns:x="urn:schemas-microsoft-com:office:excel"\
			xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\
			xmlns:html="http://www.w3.org/TR/REC-html40">\
		\
		<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\
		<Author>Pricer</Author>\
		<LastAuthor>Pricer</LastAuthor>\
		<Created>'+date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+'T'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+'Z</Created>\
		<Version>11.6568</Version>\
		</DocumentProperties>\
		<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">\
			<WindowHeight>10800</WindowHeight>\
			<WindowWidth>7635</WindowWidth>\
			<WindowTopX>360</WindowTopX>\
			<WindowTopY>150</WindowTopY>\
			<ProtectStructure>False</ProtectStructure>\
			<ProtectWindows>False</ProtectWindows>\
		</ExcelWorkbook>\
		<Styles>\
			<Style ss:ID="Default" ss:Name="Normal">\
				<Alignment ss:Vertical="Bottom"/>\
				<Borders/>\
				<Font/>\
				<Interior/>\
				<NumberFormat/>\
				<Protection/>\
			</Style>\
			<Style ss:ID="s21">\
				<Font ss:FontName="Verdana" x:Family="Swiss"/>\
			</Style>\
			<Style ss:ID="s22">\
				<Font ss:FontName="Verdana" x:Family="Swiss" ss:Bold="1"/>\
			</Style>\
			<Style ss:ID="s31">\
				<Font ss:FontName="Verdana" x:Family="Swiss"/>\
				<Borders>\
					<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>\
				</Borders>\
			</Style>\
			<Style ss:ID="s32">\
				<Font ss:FontName="Verdana" x:Family="Swiss" ss:Bold="1" />\
				<Borders>\
					<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>\
				</Borders>\
			</Style>\
		</Styles>',
		worksheet = '',
		table = '', 
		sample = '';

	if (!items || !items.length) return '';

	table += items.toText({
			start: '',
			rowStart: '<Row>',
			rowEnd: '</Row>\n',
			cellStart: '<Cell ss:StyleID="s22"><Data ss:Type="String">',
			cellEnd: '</Data></Cell>',
			end: '',
			extendCell: function(cellHtml, ntimes){
				var ntimes = ntimes ? ntimes : 1,
					colspan = (cellHtml+'').match(/ss\:MergeAcross\=.([\d]{1,})./i);

				if (colspan && colspan[1]){

					colspan = colspan[1]*1+ntimes;
					cellHtml = cellHtml.replace( /ss\:MergeAcross\=.([\d]{1,})./gi, 'ss\:MergeAcross="'+colspan+'"' );
				}
				else {

					colspan = 0+ntimes;
					cellHtml = cellHtml.replace( /\<(cell)/gi, '\<$1 ss:MergeAcross="'+colspan+'"' );
				}

				console.log(cellHtml);

				return cellHtml;
			},
			showHeader: true,
			showBody: false,
			appendTitle: '{{}}'
		});

	table += '<Row></Row>';

	table += items.toText({
			start: '',
			rowStart: '<Row>',
			rowEnd: '</Row>\n',
			cellStart: '',
			cellEnd: '',
			end: '',
			onCell: function(html, value){
				if (typeof value == 'number'){
					return '<Cell ss:StyleID="s21"><Data ss:Type="Number">'+value+'</Data></Cell>';
				}
				else {
					return '<Cell ss:StyleID="s21"><Data ss:Type="String">'+value+'</Data></Cell>';
				}
			},
			showHeader: false,
			showBody: true,
			appendTitle: '{{}}'
		});

	// get index sample and find out height in rows
	sample = items.index.flattenRanges();
	sample.height = 0;
	sample.forEach(function(th){
		var curHeight = th.split('[').length-1;

		if (sample.height<curHeight) sample.height=curHeight;
	})

	worksheet = '<Worksheet ss:Name="Price Research">';

	worksheet += '<Table ss:ExpandedColumnCount="'+sample.length+'" ss:ExpandedRowCount="'+items.length+100+'" x:FullColumns="'+1+'" x:FullRows="'+1+'" ss:StyleID="s21">';

	worksheet += table;

	worksheet += '</Table>';

	worksheet += '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\
			<Print>\
				<ValidPrinterInfo/>\
				<VerticalResolution>0</VerticalResolution>\
			</Print>\
			<Selected/>\
			<FreezePanes/>\
			<FrozenNoSplit/>\
			<SplitHorizontal>'+sample.height+'</SplitHorizontal>\
			<TopRowBottomPane>'+sample.height+'</TopRowBottomPane>\
			<ActivePane>2</ActivePane>\
			<Panes>\
				<Pane>\
					<Number>3</Number>\
					<ActiveRow>1</ActiveRow>\
					<ActiveCol>1</ActiveCol>\
					<RangeSelection>R2C2:R2C4</RangeSelection>\
				</Pane>\
			</Panes>\
			<ProtectObjects>False</ProtectObjects>\
			<ProtectScenarios>False</ProtectScenarios>\
		</WorksheetOptions>';

	worksheet += '</Worksheet>';

	xml += worksheet;
	xml += '</Workbook>';

	return xml;
}

Items.prototype.toExcelFile = function(filename, content){ //filename, content, options, indexOptions, index
	var filename = typeof arguments[0] == 'string' ? arguments[0] : 'Items-Compilation.xml',
		content = 'data:application/xml;charset=utf-8,' + encodeURIComponent(content ? content : this.toExcel.apply(this, arguments)),
		link = document.createElement('a');

	link.setAttribute('download', filename);
	link.setAttribute('href', content);
	link.setAttribute('target', '_blank');
	link.click();

	return this;
}



Items.prototype.everyItem = function(){ // deep, fn
	var fn, deep = false;

	for (var i = 0; i < arguments.length; i++) {
		if (typeof arguments[i] == 'boolean'){
			deep = arguments[i];
		}
		else if(typeof arguments[i] == 'function'){
			fn = arguments[i];
		}
	};

	if (!fn) return;

	this.forEach(function(th, i, items){
		if (deep &&
			th instanceof Items.item){

			for (key in th){
				if (th[key] instanceof Items.item){

					fn.call(th[key], th[key], key, th);
				}
			}
		}
		else if (deep &&
				(th instanceof Items ||
				 th instanceof Items.group)){

			th.everyItem(deep, fn);
		}
		else if (th instanceof Items.item){

			fn.call(th, th, i, items);
		}
		
	})
}

// - Items Types

// -- Item

Items.item = function(){
	this.id = Items.members.push(this)-1;

	for (var i = 0; i < arguments.length; i++) {
		if(typeof arguments[i] == 'function'){
			arguments[i].apply(this);
		} 
		else if(Items.handies.isObject(arguments[i])){
			Items.handies.extend.call(this, arguments[i]);
		}
	};

	return this;
};

Items.item.prototype = {
	constructorProperties: '',

	hasOwnProperty: function(key){

		if (!this.constructorProperties ){
			this.constructorProperties = new Items.item;
		}

		if (typeof this.constructorProperties[key] != 'undefined'){
			return false;
		}
		else {
			return true;
		}

	}
}

// -- Group

Items.group = function(){
	this.name = typeof arguments[0] == 'string' ? arguments[0] : '';
	this.index = new Items.index;

	this.push.apply(this, arguments);

	return this;
};

Items.handies.extendProto.call( Items.group, Items );

Items.group.prototype.hasOwnProperty = function(key){
	if (key*1 || key*1 == 0){
		return true;
	}
	else {
		return false;
	}
}

// -- Index

Items.index = function(){
	var options;

	// check arguments

	for (var i = 0; i < arguments.length; i++) {
		
		if( arguments[i] instanceof Items.index.options ){
			
			options = arguments[i];
			Array.prototype.splice.call(arguments, i, 1);
		}
		
		else if(arguments[i] instanceof Items.index ||
				arguments[i] instanceof Array ){
			
			this.concat(arguments[i]);
		}

		else if(typeof arguments[i] == 'function'){
			
			arguments[i].apply(this);
		}

		else if(typeof arguments[i] == 'object'){
			
			Items.handies.extend.call(this, arguments[i]);
		}

		else {

			this.push(arguments[i]);
		}
	};

	this.options = options ?  options : new Items.index.options;

	return this;
};

Items.handies.extendProto.call( Items.index, Items.collection );

Items.index.prototype.push = function(){
	for (var i = 0; i < arguments.length; i++) {
		if( typeof arguments[i] == 'string' ){
			Array.prototype.push.call(this, arguments[i]);
		}
	};
	return this;
}

Items.index.prototype.clear = function(){
	this.splice(0,1000000);

	return this;
}

Items.index.prototype.merge = function(){
	var keysIndex = {};

	// create keys index 
	for (var i = 0; i < this.length; i++) {
		keysIndex[this[i]] = true;
	};

	for (var i = 0; i < arguments.length; i++) {
		
		if (arguments[i] instanceof Items.index){

			for (var ii = 0; ii < arguments[i].length; ii++) {
				
				if (!keysIndex[arguments[i][ii]]){
					
					this.push(arguments[i][ii]);
				}	
			};

			// extend variables
			for (var key in arguments[i]){
				
				if (!this.hasOwnProperty(key),
					arguments[i].hasOwnProperty(key) &&
					key.match(/^\$/)){

					this[key] = arguments[i][key];
				}
			};	
		}
		
	};

	return this;
}

Items.index.prototype.flattenRanges = function(){
	var index = (new Items.index).concat(this),
		variables = this;

	for (var k = 0; k < index.length; k++) {
		
		var key = index[k],
			keyValues = key.replace(/^\[|\]/g,'').split('[');

		for (var v = keyValues.length - 1; v >= 0; v--) {
			
			if( keyValues[v].match(/^\$[^\~]{0,}\~range$/) &&
				variables[keyValues[v]]){

				var ranges = variables[keyValues[v]].split(','),
					path = ([]).concat(keyValues.splice(0, v+1)),
					pathExp = new RegExp('^\\['+path.join('\\]\\[').replace(/(\$|\~)/g,'\\$1')+'\\]'), 
					bound = [];

				path.pop();

				while( index[k] && index[k].match(pathExp) ){
					bound.push( index.splice(k,1)[0].replace(pathExp, '') );
				}

				for (var r = 0; r < ranges.length; r++) {
					var range = (''+ranges[r]).split('-');

					range[0] *= 1;
					range[1] = range[1] ? range[1]*1 : range[0];

					for (var R = range[0]-1; R < range[1]; R++) {
						var prefix = '['+path.join('][')+']['+R+']';

						for (var b = 0; b < bound.length; b++) {

							index.splice(k, 0, prefix+bound[b])
							k++;
						};
					};
				};

				k=0;
				v=-1;

			}
		};
	};

	return index;
}


// -- Index Options

Items.index.options = function(){

	Items.handies.extend.call(this, {
		indexmap: [],
		exclude: /^\ *$/g,
		excludeAll: /^\ *$/g,
		defRange: 'all', 
		prefixes: '',
		extended: false	
	});
	
	for (var i = 0; i < arguments.length; i++) {
		if(typeof arguments[i] == 'function'){
			arguments[i].apply(this);
		} 
		else if(Items.handies.isObject(arguments[i])){
			Items.handies.extend.call(this, arguments[i]);
		}
	};

	return this;
};

// -- Projection

Items.projection = function(){ // items, index, index.options
	this.el = document.createElement('div');
	this.id = Items.projection.members.push(this)-1;
	this.onUpdate = [];

	this.el.setAttribute('id', 'projection'+this.id);
	this.el.setAttribute('class', 'projection projection'+this.id);

	this.update.apply(this, arguments);

	return this;
}

// club

Items.projection.members = [];

// proto

Items.projection.prototype.update = function(){ // items, index, index.options
	var items, index, fullIndex, indexOptions;

	// check arguments

	for (var i = 0; i < arguments.length; i++) {
		
		if (arguments[i] instanceof Items){
			items = arguments[i];
		}
		else if(arguments[i] instanceof Items.index &&
				arguments[i]['$defaultFullIndex']){
			fullIndex = arguments[i];
		}
		else if(arguments[i] instanceof Items.index){
			index = arguments[i];
		}
		else if(arguments[i] instanceof Items.index.options){
			indexOptions = arguments[i];
		}

	};

	// apply arguments
	if (!this.index) this.index = new Items.index;
	if (index) this.index.clear().merge(index);

	if (!this.fullIndex) this.fullIndex = new Items.index;
	if (fullIndex) this.fullIndex.clear().merge(fullIndex);

	this.items = items ? items : this.items;
	
	this.indexOptions = indexOptions ? indexOptions : this.indexOptions ? this.indexOptions : new Items.index.options;

	// return if there is nothing to indexate

	if(!this.items || !this.items.length) return this;
	
	// indexate if index empty or new index options passed
	
	if(!this.index.length || indexOptions){
		this.index.merge(this.items.indexate(this.indexOptions).index);
	}

	// update fullIndex if it isn't set by default

	if(!this.fullIndex['$defaultFullIndex']){
		this.fullIndex = (new Items(
				this.items[0], 
				Math.floor(this.items[(this.items.length-1)/3]),
				Math.floor(this.items[(this.items.length-1)/2]),
				Math.floor(this.items[(this.items.length-1)/3*2]),
				this.items[(this.items.length-1)]
			))
			.indexate( Items.handies.extend.call(this.indexOptions, {extended: true}) )
			.index
	}

	return this;
}

Items.projection.prototype.clear = function(){
	delete this.items;
	delete this.index;
	delete this.indexOptions;
	delete this.fullIndex;
	
	this.el.innerHTML = '';

	return this;
}

Items.projection.prototype.reflectItem = function(item){
	var projection = this;

	if (item instanceof Items.item){
		var itemRow = projection.el.getElementsByClassName('id'+item.id)[0];

		if (itemRow){
			itemRow.innerHTML = (new Items(item)).toText({
				start: '',
				rowStart: '<tr class="id{{id}}">',
				rowEnd: '</tr>',
				cellStart: '<td>',
				cellEnd: '</td>',
				end: '',
				showHeader: false,
				showBody: true
			}, this.index );	
		}

	}

	return this;
}

Items.projection.onUpdate = [];

Items.projection.prototype.reflect = function(){
	var projection = this,
		html = '',
		usedKeys = {};

	// -- reflection controls

	html += '<div class="controls hover-slide">';

	html += '<h2>ADJUST DISPLAYED VARIABLES</h2>';

	// add selected values

	for (var i = 0; i < this.index.length; i++) {
		
		usedKeys[this.index[i]] = true;

		html += '<div>';
		html += '<span class="handle">&#X25CE;</span>'
		html += '<label checked="checked">';
		html +=	'<input type="checkbox" value="'+projection.index[i]+'" checked="true" />';
		html +=	projection.index[i].replace(/^\[|\]/g,'').replace(/\[/g, ' > ');
		html += '</label>';
		html += '</div>';
	};

	// add other values

	for (var i = 0; i < this.fullIndex.length; i++) {
		
		if (!usedKeys[this.fullIndex[i]]){
			html += '<div>';
			html += '<span class="handle">&#X25CE;</span>'
			html += '<label>';
			html +=	'<input type="checkbox" value="'+projection.fullIndex[i]+'" />';
			html +=	projection.fullIndex[i].replace(/^\[|\]/g,'').replace(/\[/g, ' > ');
			html += '</label>';
			html += '</div>';
		}
	};

	html += '<button class="apply">APPLY</button>';

	html += '</div>';

	// add default controls styles

	html += '<style>'+Items.handies.valuate(this.style, this)+'</style>';


	if (projection.items instanceof Items){

		// -- projection

		html += '<table cellspacing="0px">';

		// create header

		html += projection.items.toText({
			start: '',
			rowStart: '<tr>',
			rowEnd: '</tr>',
			cellStart: '<th>',
			cellEnd: '</th>',
			end: '',
			extendCell: function(cellHtml, ntimes){
				var ntimes = ntimes ? ntimes : 1,
					colspan = (cellHtml+'').match(/colspan\=.([\d]{1,})./i);

				if (colspan && colspan[1]){

					colspan = colspan[1]*1+ntimes;
					cellHtml = cellHtml.replace( /colspan\=.([\d]{1,})./gi, 'colspan="'+colspan+'"' );
				}
				else {

					colspan = 1+ntimes;
					cellHtml = cellHtml.replace( /\<(tr|th)/g, '\<$1 colspan="'+colspan+'"' );
				}

				return cellHtml;
			},
			showHeader: true,
			showBody: false
		}, projection.index );

		// create body

		html += projection.items.toText({
			start: '',
			rowStart: '<tr id="{{id}}" class="id{{id}}">',
			rowEnd: '</tr>',
			cellStart: '<td>',
			cellEnd: '</td>',
			end: '',
			showHeader: false,
			showBody: true
		}, projection.index );

		html += '</ table>';
	}
	

	// apply html to element

	this.el.innerHTML = html;

	// -- actions
	
	var labels = this.el.getElementsByClassName('controls')[0].getElementsByTagName('label'), 
		apply = this.el.getElementsByClassName('controls')[0].getElementsByClassName('apply')[0];

	function toogleLabelBox(e){
			
			if( this.getElementsByTagName('input')[0].checked ){
				this.setAttribute('checked', 'checked');
			}
			else {
				this.removeAttribute('checked');
			}
		}

	function updateProjectionIndex(){

			var selection = projection.el.getElementsByClassName('controls')[0].getElementsByTagName('input');

			projection.index.clear();

			for (var i = 0; i < selection.length; i++) {
				if( selection[i].checked ){
					projection.index.push( selection[i].getAttribute('value') )
				}
			}

			projection.reflect();

		}

	for (var i = 0; i < labels.length; i++) {
		labels[i].onclick = toogleLabelBox;
	};

	apply.onclick = updateProjectionIndex;

	// trigger on update

	for (var i = 0; i < projection.onUpdate.length; i++) {
		if (typeof projection.onUpdate[i] == 'function') projection.onUpdate[i](this);
	};

	for (var i = 0; i < Items.projection.onUpdate.length; i++) {
		if (typeof projection.onUpdate[i] == 'function') projection.onUpdate[i](this);
	};

	return this;
}

Items.projection.prototype.style = '\
				.controls { overflow: hidden; padding:0px; font-size: 12px; font-family: sans-serif; position: relative} \
				.controls.hover-slide { margin:0px; height:32px; } \
				.controls.hover-slide:hover { height: auto !important } \
				.controls h2 { height:30px; padding-left:10px; padding-right:10px; line-height:30px; font-size: 12px; background-color: #c1c1c1; color: white; margin:0px; } \
				.controls div { display: block; } \
				.controls .handle { display: inline-block; float: left; width: 25px; text-align:center; } \
				.controls label { display: block; padding-left:25px; padding-right:10px; line-height:20px; height:20px; border-bottom: 1px dotted white; } \
				.controls label[checked=checked] input, \
				.controls label:not([checked=checked]) input { display: none;} \
				.controls label[checked=checked] { background-color: #e7e7e7 } \
				.controls label:not([checked=checked]) { background-color: none } \
				.controls button { display:block; border: none; border-top: 2px solid #e7e7e7; border-bottom: 2px solid #e7e7e7; height: 30px; outline: none; background-color: #f3f3f3; text-align: left; padding-left:25px; width: 100% } \
				.controls button:hover { background-color: #f9f9f9; } \
				\
				#projection{{id}} table { text-align: left; min-width:100% }\
				#projection{{id}} table { font-family: Arial, sans-serif; font-size: 11px; border: 1px solid #e7e7e7; }\
				#projection{{id}} table tr{ height: 16px; line-height: 15px; }\
				#projection{{id}} table th, \
				#projection{{id}} table td{ white-space:nowrap; padding: 0px 5px; border-right: 1px solid #e7e7e7; border-bottom: 1px solid #e7e7e7; margin: 0px; }\
				#projection{{id}} table th:last-child, \
				#projection{{id}} table td:last-child { border-right: none; }';