var ObjectId = Schema.ObjectId;
var Point = new Schema({
	x : Number,
	y : Number,
	length : Number,
	angle : {type : Number, min : 0, max : 360},
	angleInRadians : Number,
	quadrant : {type : Number, min : 0, max : 360}
});

var Size = new Schema({
	width : Number, 
	height : Number,
});

var Rectangle = new Schema({
	x : Number,
	y : Number,
	width : Number,
	height : Number,
	point : Point,
	size : Size,
	left : Number,
	top : Number,
	right : Number,
	bottom : Number,
	center : Point,
	topLeft : Point,
	topRight : Point,
	bottomLeft : Point,
	bottomRight : Point,
	leftCenter : Point,
	topCenter : Point,
	rightCenter : Point,
	bottomCenter : Point
});

var Matrix = new Schema({
	scaleX : Number,
	scaleY : Number,
	shearX : Number,
	shearY : Number,
	translateX : Number,
	translateY : Number,
	values : [Number],
	rotation : Number,
});

var Item = new Schema({
	id : Number,
	name : String,
	position : Point,
	style : PathStyle,
	visible : Boolean,
	blendMode : {type : String, enum : {'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion', 'hue', 'saturation', 'luminosity', 'color', 'add', 'subtract', 'average', 'pin-light', 'negation'}},
	opacity : {type : Number, min : 0, max : 1},
	guide : Number, //should be Boolean?
	clipMask : Boolean,
	project : ObjectId,
	layer : ObjectId
	parent : ObjectId,
	children : [ObjectId],
	firstChild : ObjectId,
	lastChild : ObjectId,
	nextSibling : ObjectId,
	previousSibling : ObjectId,
	index : Number,
	bounds : Rectangle,
	strokeBounds : Rectangle,
	handleBounds : Rectangle,
	//*PathStyle*
});

var Group = new Schema({	
	//*ITEM*
	clipped : Boolean
})

var Layer = new Schema({
	//*GROUP*
	//*ITEM*
});

var PlacedItem = new Schema({
	//*ITEM*
	matrix : Matrix
});

var Raster = new Schema({
	size : Size,
	width : Number,
	height : Number,
	ppi : Size,
	image : String, //url to image
	//*ITEM*
});

var placedSymbol = new Schema({
	symbol : Symbol
	//*ITEM*
	//*PlacedItem*
});

var PathItem = new Schema({
	//*ITEM*
});

var Path = new Schema({
	segments : [Segment],
	firstSegment : Segment,
	lastSegment : Segment,
	curves : [Curve],
	firstCurve : Curve,
	lastCurve : Curve,
	closed : Boolean,
	clockwise : Boolean,
	length : Number
	//*ITEM*
});

var CompoundPath = new Schema({
	//*ITEM*
});
	

var Segment = new Schema({	
	point : Point,
	handleIn : Point,
	handleOut : Point,
	index : Number,
	path : ObjectId,
	curve : ObjectId,
	next : ObjectId,
	previous : ObjectId,
});

var Curve = new Schema({	
	point1 : Point,
	point2 : Point,
	handle1 : Point,
	handle2 : Point,
	segment1 : Segment,
	segment2 : Segment,
	path : ObjectId,
	index : Number,
	next : ObjectId,
	previous : ObjectId,
	length : Number
})

var PathStyle = new Schema({	
	strokeColor : Color,
	strokeWidth : Number,
	strokeCap : {type : String, enum : {'round', 'square', 'butt'}},
	strokeJoin : {type : String, enum : {'miter', 'round', 'bevel'}},
	dashOffset : Number,
	dashArray : [Number],
	miterLimit : Number,
	fillColor : Color
});

var Project = new Schema({
	layers : [Layers],
	symbols : [Symbol],
	views : [View]
});

var Symbol = new Schema({
	definition : Item,
});

var Color = new Schema({
	type : {type : String, enum:{'rgb','hsb','gray'}},
	alpha : {type : Number, min : 0, max : 1},
	red : {type : Number, min : 0, max : 1},
	green : {type : Number, min : 0, max : 1},
	blue : {type : Number, min : 0, max : 1},
	gray : {type : Number, min : 0, max : 1},
	hue : {type : Number, min : 0, max : 360},
	saturation : {type : Number, min : 0, max : 1},
	brightness : {type : Number, min : 0, max : 1},
	lightness : {type : Number, min : 0, max : 1},
});

var TextItem = new Schema({
	content : String,
	characterStyle : CharacterStyle, 
	paragraphStyle : ParagraphStyle, 
	//*ITEM*
});

var PointText = new Schema({
	point : Point
	//*ITEM*
	//*TextItem*
});

var CharacterStyle = new Schema({
	font : String,
	fontSize : Number
	//*PathStyle*
});

var ParagraphStyle = new Schema({
	justification : {type : String, enum : ('left', 'right', 'center')
});



/* var Board = new Schema({
	title : String,
	//authorization
	owner : ObjectId,
	authorizedUsers : [ObjectId],

	//for view initialization
	width : Number,
	height : Number,

	
});