'use strict';
var express = require('express');
var router	= express.Router();
var DataSerializer = require('../serializers/data');
var ErrorSerializer = require('../serializers/error');
var users;
var objects;
var units;
var flows;
var snippets;
var datatypes;
var tokens;
var rules;
var dashboards;
var qt;
var objectTypes = ['rooter', 'sensor', 'computer', 'laptop', 'desktop', 'phone', 'smartphone', 'nodemcu', 'tablet', 'server', 'printer'];

function nl2br(str, isXhtml) {
    var breakTag = (isXhtml || typeof isXhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
};

function alphaSort(obj1, obj2) {
    return (obj1.name).toLowerCase().localeCompare((obj2.name).toLowerCase());
};

router.get('/', function(req, res) {
	res.render('index', {
		title : 't6, IoT platform and API',
		currentUrl: req.path,
		user: req.session.user
	});
});

router.get('/objects', Auth,  function(req, res) {
	objects	= db.getCollection('objects');
	qt	= dbQuota.getCollection('quota');
	var query = { 'user_id': req.session.user.id };
	var pagination=12;
	req.query.page=req.query.page!==undefined?req.query.page:1;
	var offset = (req.query.page -1) * pagination;

	var o = objects.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data();
	if ( o.length == 0 ) {
		res.redirect('/objects/add');
	} else {
		var objects_length = (objects.chain().find(query).data()).length;
		res.render('objects/objects', {
			title : 'My Objects',
			objects: o,
			objects_length: objects_length,
			new_object: {},
			page: req.query.page,
			pagenb: Math.ceil(objects_length/pagination),
			types: objectTypes,
			message: {},
			user: req.session.user,
			nl2br: nl2br,
			currentUrl: req.path,
			striptags: striptags,
			quota : (quota[req.session.user.role])
		});
	}
});

router.get('/objects/add', Auth, function(req, res) {
	res.render('objects/add', {
		title : 'Add an Object',
		message: {},
		user: req.session.user,
		types: objectTypes,
		new_object: {},
		nl2br: nl2br,
		currentUrl: req.path,
		striptags: striptags
	});
});

router.get('/objects/:object_id([0-9a-z\-]+)', Auth, function(req, res) {
	var object_id = req.params.object_id;
	objects	= db.getCollection('objects');
	flows	= db.getCollection('flows');
	if ( object_id !== undefined ) {
		var queryO = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : object_id },
			]
		};
		var json = {
			object: objects.findOne(queryO),
			flows: flows.findOne({ 'user_id': req.session.user.id })
		}
		if ( json.object ) {
			var qr = qrCode.qrcode(9, 'M');
			qr.addData(baseUrl+'/objects/'+object_id+'/public');
			qr.make();
			var message = req.session.message!==null?req.session.message:null;
			req.session.message = null; // Force to unset
			res.render('objects/object', {
				title : 'Object '+json.object.name,
				object: json.object,
				flows: json.flows,
				user: req.session.user,
				nl2br: nl2br,
				message: message,
				striptags: striptags,
				currentUrl: req.path,
				qr_img: qr.createImgTag(5)
			});
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
	}
});

router.get('/objects/:object_id([0-9a-z\-]+)/public', function(req, res) {
	var object_id = req.params.object_id;
	objects	= db.getCollection('objects');
	users	= db.getCollection('users');
	var queryO = {
		'$and': [
					{ 'isPublic': 'true' },
					{ 'id' : object_id },
				]
	};
	var json = objects.chain().simplesort('user_id').find(queryO).limit(1);
	var meta = ((json.data())[0])!==undefined?((json.data())[0]).meta:'';
	var r = (json.eqJoin(users.chain(), 'user_id', 'id').data())[0];
	if ( r ) {
		r.left.created = moment(meta.created).format('dddd, MMMM Do YYYY, H:mm:ss');
		r.left.updated = moment(meta.updated).format('dddd, MMMM Do YYYY, H:mm:ss');
		res.render('objects/public', {
			title : 'Object '+r.left.name,
			object: r.left,
			owner: r.right,
			user: req.session.user,
			nl2br: nl2br,
			currentUrl: req.path,
			striptags: striptags
		});
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.get('/objects/:object_id([0-9a-z\-]+)/qrprint', Auth, function(req, res) {
	var object_id = req.params.object_id;
	objects	= db.getCollection('objects');
	if ( object_id !== undefined ) {
		var queryO = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : object_id },
			]
		};
	}
	var json = objects.findOne(queryO);
	if ( json ) {
		var qr = qrCode.qrcode(9, 'M');
		var url = baseUrl+'/objects/'+object_id+'/public';
		qr.addData(url);
		qr.make();
		res.render('objects/qrprint', {
			title : 'Object '+json.name,
			url: url,
			qr_img1: qr.createImgTag(1),
			qr_img2: qr.createImgTag(2),
			qr_img3: qr.createImgTag(3),
			qr_img4: qr.createImgTag(4),
			qr_img5: qr.createImgTag(5),
			object_id: object_id,
			currentUrl: req.path,
			striptags: striptags
		});
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.get('/objects/:object_id([0-9a-z\-]+)/edit', Auth, function(req, res) {
	var object_id = req.params.object_id;
	objects	= db.getCollection('objects');
	if ( object_id !== undefined ) {
		var queryO = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : object_id },
			]
		};
	}
	var json = objects.findOne(queryO);
	//console.log(json);
	if ( json ) {
		res.render('objects/edit', {
			title : 'Edit Object '+json.name,
			object: json,
			types: objectTypes,
			currentUrl: req.path,
			user: req.session.user
		});
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.post('/objects/:object_id([0-9a-z\-]+)/edit', Auth, function(req, res) {
	var object_id = req.params.object_id;
	if ( object_id !== undefined ) {
		objects	= db.getCollection('objects');
		var queryO = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : object_id },
			]
		};
		var json = (objects.chain().find(queryO).limit(1).data())[0];
		//console.log(json);
		if ( json ) {
			json.name 			= req.body.name!==undefined?req.body.name:json.name;
			json.type 			= req.body.type!==undefined?req.body.type:json.type;
			json.description	= req.body.description!==undefined?req.body.description:json.description;
			json.position		= req.body.position!==undefined?req.body.position:json.position;
			json.longitude		= req.body.longitude!==undefined?req.body.longitude:json.longitude;
			json.latitude		= req.body.latitude!==undefined?req.body.latitude:json.latitude;
			json.isPublic		= req.body.isPublic!==undefined?req.body.isPublic:json.isPublic;
			json.ipv4			= req.body.ipv4!==undefined?req.body.ipv4:json.ipv4;
			json.ipv6			= req.body.ipv6!==undefined?req.body.ipv6:json.ipv6;
			json.user_id		= req.session.user.id;
			
			objects.update(json);
			db.save();
			
			res.redirect('/objects/'+object_id);
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.get('/objects/:object_id([0-9a-z\-]+)/remove', Auth, function(req, res) {
	var object_id = req.params.object_id;
	objects	= db.getCollection('objects');
	if ( object_id !== undefined ) {
		var queryO = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : object_id },
			]
		};
	}
	var json = objects.chain().find(queryO).limit(1).remove().data();
	//console.log(json);
	if ( json ) {
		res.redirect('/objects');
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.post('/objects/add', Auth, function(req, res) {
	objects	= db.getCollection('objects');
	var message = undefined;
	var error = undefined;
	var queryQ = { '$and': [
        {'user_id' : req.bearer!==undefined?req.bearer.user_id:req.session.bearer!==undefined?req.session.bearer.user_id:null}
 	]};
	var new_object = {
		id:				uuid.v4(),
		name:			req.body.name!==undefined?req.body.name:'unamed',
		type:  			req.body.type!==undefined?req.body.type:'default',
		description:	req.body.description!==undefined?req.body.description:'',
		position: 	 	req.body.position!==undefined?req.body.position:'',
		longitude:		req.body.longitude!==undefined?req.body.longitude:'',
		latitude:		req.body.latitude!==undefined?req.body.latitude:'',
		isPublic:		req.body.isPublic!==undefined?req.body.isPublic:'false',
		ipv4:  			req.body.ipv4!==undefined?req.body.ipv4:'',
		ipv6:			req.body.ipv6!==undefined?req.body.ipv6:'',
		user_id:		req.session.user.id,
	};
	var i = (objects.find(queryQ)).length;
	if( i >= (quota[req.session.user.role]).objects ) {
		message = {type: 'danger', value: 'Over Quota!'};
		error = true;
	} else {
		var query = { 'user_id': req.session.user.id };
		var pagination=12;
		req.query.page=req.query.page!==undefined?req.query.page:1;
		var offset = (req.query.page -1) * pagination;
		
		if ( new_object.name && new_object.type && new_object.user_id ) {
			objects.insert(new_object);
			db.save();
			message = {type: 'success', value: 'Object <a href="/objects/'+new_object.id+'">'+new_object.name+'</a> successfuly added.'};
			req.session.message = message;
		} else {
			message = {type: 'danger', value: 'Please give a name and a type to your Object!'};
			error = true;
		}
	}
	
	if ( error ) {
		res.render('objects/add', {
			title : 'Add an Objects',
			objects: objects.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data(),
			new_object: new_object,
			page: req.query.page,
			pagenb: Math.ceil(((objects.chain().find(query).data()).length) / pagination),
			types: objectTypes,
			user: req.session.user,
			message: message,
			currentUrl: req.path,
			nl2br: nl2br
		});
	} else {
		res.redirect('/objects/'+new_object.id);
	}
});

router.get('/flows', Auth, function(req, res) {
	flows	= db.getCollection('flows');
	qt	= dbQuota.getCollection('quota');
	var query = { 'user_id': req.session.user.id };
	var pagination=12;
	req.query.page=req.query.page!==undefined?req.query.page:1;
	var offset = (req.query.page -1) * pagination;
	var message = req.session.message!==null?req.session.message:null;
	req.session.message = null; // Force to unset

	var f = flows.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data();
	if ( f.length == 0 ) {
		res.redirect('/flows/add');
	} else {
		var flows_length = (flows.chain().find(query).data()).length;
		res.render('flows/flows', {
			title : 'My Flows',
			flows: f,
			flows_length: flows_length,
			page: req.query.page,
			pagenb: Math.ceil(flows_length/pagination),
			user: req.session.user,
			currentUrl: req.path,
			message: message,
			quota : (quota[req.session.user.role])
		});
	}
});

router.get('/flows/add', Auth, function(req, res) {
	objects	= db.getCollection('objects');
	units	= db.getCollection('units');
	datatypes	= db.getCollection('datatypes');
	var query = { 'user_id': req.session.user.id };
	var o = objects.chain().find(query).sort(alphaSort).data();
	var dt = datatypes.chain().find().sort(alphaSort).data();
	var u = units.chain().find().sort(alphaSort).data();
	res.render('flows/add', {
		title : 'Add a Flow',
		message: {},
		objects: o,
		datatypes: dt,
		units: u,
		user: req.session.user,
		new_flow: {objects:[]},
		nl2br: nl2br,
		currentUrl: req.path,
		striptags: striptags
	});
});

router.get('/flows/:flow_id([0-9a-z\-]+)', Auth, function(req, res) {
	var flow_id = req.params.flow_id;
	objects	= db.getCollection('objects');
	flows	= db.getCollection('flows');
	if ( flow_id !== undefined ) {
		var queryF = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : flow_id },
			]
		};
		var json = {
			flow: flows.findOne(queryF)
		}
		if ( json.flow ) {
			var message = req.session.message!==null?req.session.message:null;
			req.session.message = null; // Force to unset
			res.render('flows/flow', {
				title :		'Flow '+json.flow.name,
				user:		req.session.user,
				nl2br:		nl2br,
				flow:		json.flow,
				snippet:	{p:{}, icon: 'fa fa-line-chart', name: req.query.title!==undefined?req.query.title:json.flow.name, flows: [flow_id]},
				flows:		flows.chain().find({ 'user_id': req.session.user.id }).sort(alphaSort).data(),
				message:	message,
				striptags:	striptags,
				currentUrl:	req.path,
				graph_title:		req.query.title!==undefined?req.query.title:json.flow.name,
				graph_startdate:	moment(req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd'), 'x').format('DD/MM/YYYY'),
				graph_startdate2:	req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd').format('x'),
				graph_enddate:		moment(req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd'), 'x').format('DD/MM/YYYY'),
				graph_enddate2:		req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd').format('x'),
				graph_max:			req.query.max!==undefined?req.query.max:'50',
				graph_ttl:			req.query.graph_ttl!==undefined?req.query.graph_ttl:'',
				graph_weekendAreas:	req.query.weekendAreas!==undefined?req.query.weekendAreas:'',
				graph_color:		req.query.color!==undefined?req.query.color:'#edc240',
				graph_fill:			req.query.fill!==undefined?req.query.fill:'false',
				graph_autorefresh:	req.query.autorefresh!==undefined?req.query.autorefresh:'false',
				graph_chart_type:	req.query.chart_type!==undefined?req.query.chart_type:'bars',
				graph_layout:		req.query.layout!==undefined?req.query.layout:12,
			});
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
	}
});

router.get('/flows/:flow_id([0-9a-z\-]+)/edit', Auth, function(req, res) {
	var flow_id = req.params.flow_id;
	objects	= db.getCollection('objects');
	units	= db.getCollection('units');
	datatypes	= db.getCollection('datatypes');
	flows	= db.getCollection('flows');
	var query = { 'user_id': req.session.user.id };
	var o = objects.chain().find(query).sort(alphaSort).data();
	var dt = datatypes.chain().find().sort(alphaSort).data();
	var u = units.chain().find().sort(alphaSort).data();
	if ( flow_id !== undefined ) {
		var queryF = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : flow_id },
			]
		};
		var json = {
			flow: flows.findOne(queryF)
		}
		if ( json.flow ) {
			var message = req.session.message!==null?req.session.message:null;
			req.session.message = null; // Force to unset
			res.render('flows/edit', {
				title : 'Edit Flow '+json.flow.name,
				user: req.session.user,
				nl2br: nl2br,
				flow: json.flow,
				message: message,
				striptags: striptags,
				currentUrl: req.path,
				objects: o,
				datatypes: dt,
				units: u,
			});
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
	}
});

router.post('/flows/:flow_id([0-9a-z\-]+)/edit', Auth, function(req, res) {
	var flow_id = req.params.flow_id;
	if ( flow_id !== undefined ) {
		flows	= db.getCollection('flows');
		var queryF = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : flow_id },
			]
		};
		var json = (flows.chain().find(queryF).limit(1).data())[0];
		var owner_permission = req.body.owner_permission!==undefined?req.body.owner_permission:'6';
		var group_permission = req.body.group_permission!==undefined?req.body.group_permission:'0';
		var other_permission = req.body.other_permission!==undefined?req.body.other_permission:'0';
		var linked_objects = req.body['objects[]']!==undefined?req.body['objects[]']:new Array();
		if( req.body['objects[]'] instanceof Array ) {
			//
		} else {
			linked_objects = [linked_objects];
		}
		//console.log(json);
		if ( json ) {
			json.id=			flow_id;
			json.data_type=		req.body.datatype!==undefined?req.body.datatype:null;
			json.name=			req.body.name!==undefined?req.body.name:null;
			json.permission=	owner_permission+group_permission+other_permission;
			json.objects=		linked_objects;
			json.unit=			''; // TODO
			json.unit_id=		req.body.unit!==undefined?req.body.unit:null;
			//json.user_id=		user_id; // Don't need to update
			json.theme=			req.body.theme!==undefined?req.body.theme:null;
			
			flows.update(json);
			db.save();
			
			res.redirect('/flows/'+flow_id);
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.get('/flows/:flow_id([0-9a-z\-]+)/graph', Auth, function(req, res) {
	var flow_id = req.params.flow_id;
	res.render('flows/graph', {
		title : 'Graph a Flow',
		flow_id: flow_id,
		user: req.session.user,
		moment: moment,
		currentUrl: req.path,
		snippet:			{p:{}, icon: 'fa fa-line-chart', name: req.query.title!==undefined?req.query.title:'Default Title', flows: [flow_id]},
		graph_title:		req.query.title!==undefined?req.query.title:'Default Title',
		graph_startdate:	moment(req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd'), 'x').format('DD/MM/YYYY'),
		graph_startdate2:	req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd').format('x'),
		graph_enddate:		moment(req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd'), 'x').format('DD/MM/YYYY'),
		graph_enddate2:		req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd').format('x'),
		graph_max:			req.query.max!==undefined?req.query.max:'50',
		graph_ttl:			req.query.graph_ttl!==undefined?req.query.graph_ttl:'',
		graph_weekendAreas:	req.query.weekendAreas!==undefined?req.query.weekendAreas:'',
		graph_color:		req.query.color!==undefined?req.query.color:'#edc240',
		graph_fill:			req.query.fill!==undefined?req.query.fill:'false',
		graph_autorefresh:	req.query.autorefresh!==undefined?req.query.autorefresh:'false',
		graph_chart_type:	req.query.chart_type!==undefined?req.query.chart_type:'bars',
		graph_layout:		req.query.layout!==undefined?req.query.layout:12,
	});
});

router.post('/flows/add', Auth, function(req, res) {
	flows	= db.getCollection('flows');
	objects	= db.getCollection('objects');
	units	= db.getCollection('units');
	datatypes	= db.getCollection('datatypes');
	var error = undefined;
	var user_id = req.bearer!==undefined?req.bearer.user_id:req.session.bearer!==undefined?req.session.bearer.user_id:null;
	var message = '';
	var queryQ = { '$and': [  {'user_id' : user_id} ]};
	
	var flow_id = uuid.v4();
	var owner_permission = req.body.owner_permission!==undefined?req.body.owner_permission:'6';
	var group_permission = req.body.group_permission!==undefined?req.body.group_permission:'0';
	var other_permission = req.body.other_permission!==undefined?req.body.other_permission:'0';
	var linked_objects = req.body['objects[]']!==undefined?req.body['objects[]']:new Array();
	if ( typeof linked_objects !== 'object' ) linked_objects = new Array(linked_objects);
	
	var new_flow = {
		id:				flow_id,
		data_type:		req.body.datatype!==undefined?req.body.datatype:null,
		name:			req.body.name!==undefined?req.body.name:null,
		permission:		owner_permission+group_permission+other_permission,
		objects:		linked_objects,
		unit:			'', // TODO
		unit_id:		req.body.unit!==undefined?req.body.unit:null,
		user_id:		user_id,
		theme:			req.body.theme!==undefined?req.body.theme:null
	};
	//console.log(new_flow);
	var i = (flows.find(queryQ)).length;
	if( i >= (quota[req.session.user.role]).flows ) {
		message = {type: 'danger', value: 'Over Quota!'};
		error = true;
	} else {
		if ( new_flow.name && new_flow.data_type && new_flow.user_id && new_flow.unit_id ) {
			flows.insert(new_flow);
			db.save();
			message = {type: 'success', value: 'Flow <a href="/flows/'+new_flow.id+'">'+new_flow.name+'</a> successfully added.'};
			req.session.message = message;
		} else {
			message = {type: 'danger', value: 'Please give a name, a type and a unit to your Flow!'};
			error = true;
		}
	}
	var query = { 'user_id': req.session.user.id };
	var pagination=12;
	req.query.page=req.query.page!==undefined?req.query.page:1;
	var offset = (req.query.page -1) * pagination;
	var f = flows.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data();
	var o = objects.chain().find(query).sort(alphaSort).data();
	var dt = datatypes.chain().find().sort(alphaSort).data();
	var u = units.chain().find().sort(alphaSort).data();
	
	if ( error ) {
		res.render('flows/add', {
			title : 't6 Flows',
			flows: f,
			objects: o,
			datatypes: dt,
			units: u,
			page: req.query.page,
			pagenb: Math.ceil(((flows.chain().find(query).data()).length) / pagination),
			user: req.session.user,
			new_flow: new_flow,
			message: message,
			currentUrl: req.path,
		});
	} else {
		res.redirect('/flows/'+new_flow.id); //
	}
});

router.get('/account/profile', Auth, function(req, res) {
	objects	= db.getCollection('objects');
	flows	= db.getCollection('flows');
	tokens	= db.getCollection('tokens');
	rules	= dbRules.getCollection('rules');
	dashboards= dbDashboards.getCollection('dashboards');
	qt		= dbQuota.getCollection('quota');
	snippets= dbSnippets.getCollection('snippets');

	var queryO = { 'user_id' : req.session.user.id };
	var queryF = { 'user_id' : req.session.user.id };
	var queryT = { 'user_id' : req.session.user.id };
	var queryR = { 'user_id' : req.session.user.id };
	var queryS = { 'user_id' : req.session.user.id };
	var queryD = { 'user_id' : req.session.user.id };
	var queryQ = { '$and': [
     	           {'user_id' : req.session.user.id},
    	           {'date': { '$gte': moment().subtract(7, 'days').format('x') }},
    			]};

	var options = {
	  url: 'http://en.gravatar.com/' + req.session.user.mail_hash + '.json',
	  headers: {
	    'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/44.0'
	  }
	};
	request(options, function(error, response, body) {
		if ( !error && response.statusCode != 404 ) {
			res.render('profile', {
				title : 'My Profile',
				objects : ((objects.chain().find(queryO).data()).length),
				flows : ((flows.chain().find(queryF).data()).length),
				rules : (rules.chain().find(queryR).data().length),
				snippets : (snippets.chain().find(queryS).data().length),
				dashboards : (dashboards.chain().find(queryD).data().length),
				tokens : (tokens.chain().find(queryT).data()),
				calls : (qt.chain().find(queryQ).data().length),
				quota : (quota[req.session.user.role]),
				user : req.session.user,
				currentUrl: req.path,
				gravatar : JSON.parse(body)
			});
		} else {
			res.render('profile', {
				title : 'My Profile',
				objects : ((objects.chain().find(queryO).data()).length),
				flows : ((flows.chain().find(queryF).data()).length),
				rules : (rules.chain().find(queryR).data().length),
				snippets : (snippets.chain().find(queryS).data().length),
				dashboards : (dashboards.chain().find(queryD).data().length),
				tokens : (tokens.chain().find(queryT).data()),
				calls : (qt.chain().find(queryQ).data().length),
				quota : (quota[req.session.user.role]),
				user : req.session.user,
				currentUrl: req.path,
				gravatar : null
			});
		}
	});
});

router.get('/search', Auth, function(req, res) {
	res.render('search', {
		title : 'Search',
		objects: [],
		flows: [],
		snippets: [],
		dashboards: [],
		currentUrl: req.path,
		user: req.session.user
	});
});

router.post('/search', Auth, function(req, res) {
	objects	= db.getCollection('objects');
	flows	= db.getCollection('flows');
	snippets	= dbSnippets.getCollection('snippets');
	dashboards	= dbDashboards.getCollection('dashboards');
	if (!req.body.q) {
		res.render('search', {
			title : 'Search results',
			objects: [],
			flows: [],
			snippets: [],
			dashboards: [],
			currentUrl: req.path,
			user: req.session.user
		});
	} else {
		var queryO = {
				'$and': [
							{ 'user_id': req.session.user.id },
							{ 'name': {'$regex': [req.body.q, 'i'] } }
						]
					};
		var queryF = {
				'$and': [
							{ 'user_id': req.session.user.id },
							{ 'name': {'$regex': [req.body.q, 'i'] } }
						]
					};
		var queryS = {
				'$and': [
							{ 'user_id': req.session.user.id },
							{ 'name': {'$regex': [req.body.q, 'i'] } }
						]
					};
		var queryD = {
				'$and': [
							{ 'user_id': req.session.user.id },
							{ 'name': {'$regex': [req.body.q, 'i'] } }
						]
					};
		res.render('search', {
			title : 'Search results',
			objects: objects.find(queryO),
			flows: flows.find(queryF),
			snippets: snippets.find(queryS),
			dashboards: dashboards.find(queryD),
			q:req.body.q,
			user: req.session.user,
			currentUrl: req.path,
			nl2br: nl2br
		});
	}
});

router.get('/decision-rules', Auth, function(req, res) {
	rules = dbRules.getCollection("rules");
	var queryR = { 'user_id': req.session.user.id };
	/*queryR = {
		'$and': [
					{ 'user_id': req.session.user.id },
					{ 'id': 'ceda166a-df25-4bc4-ae77-3823f63193f9' }
				]
			};
	*/
	var r = rules.chain().find(queryR).simplesort('on', 'priority', 'name').data();
	res.render('decision-rules', {
		title : 'Decision Rules',
		user: req.session.user,
		currentUrl: req.path,
		rules: r,
	});
});

router.post('/decision-rules/save-rule/:rule_id([0-9a-z\-]+)', Auth, function(req, res) {
	/* no put? */
	var rule_id = req.params.rule_id;
	if ( !rule_id || !req.body.name ) {
		res.status(412).send(new ErrorSerializer({'id': 1009,'code': 412, 'message': 'Precondition Failed'}).serialize());
	} else {
		rules = dbRules.getCollection("rules");
		var queryR = {
			'$and': [
						{ 'user_id': req.session.user.id },
						{ 'id': rule_id }
					]
				};
		var rule = rules.findOne(queryR);
		if ( !rule ) {
			res.status(404).send(new ErrorSerializer({'id': 1006,'code': 404, 'message': 'Not Found'}).serialize());
		} else {
			rule.name			= req.body.name;
			rule.on				= req.body.on;
			rule.priority		= req.body.priority;
			rule.consequence	= req.body.consequence;
			rule.condition		= req.body.condition;
			rule.flow_control	= req.body.flow_control;
			rules.update(rule);
			res.status(200).send({ 'code': 200, message: 'Successfully updated', rule: rule });
		}
	}
});

router.get('/about', function(req, res) {
	res.render('about', {
		title : 'About t6',
		currentUrl: req.path,
		user: req.session.user
	});
});

router.get('/dashboards', Auth, function(req, res) {
	dashboards	= dbDashboards.getCollection('dashboards');
	qt		= dbQuota.getCollection('quota');
	var query = { 'user_id': req.session.user.id };
	var pagination=12;
	req.query.page=req.query.page!==undefined?req.query.page:1;
	var offset = (req.query.page -1) * pagination;
	var message = req.session.message!==null?req.session.message:null;
	req.session.message = null; // Force to unset

	var d = dashboards.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data();
	if ( d.length == 0 ) {
		res.redirect('/dashboards/add');
	} else {
		var dashboards_length = (dashboards.chain().find(query).data()).length;
		res.render('dashboards/dashboards', {
			title : 'My Dashboards',
			dashboards: d,
			dashboards_length: dashboards_length,
			page: req.query.page,
			pagenb: Math.ceil(dashboards_length/pagination),
			user: req.session.user,
			currentUrl: req.path,
			message: message,
			quota : (quota[req.session.user.role])
		});
	}
});

router.get('/dashboards/add', Auth, function(req, res) {
	dashboards	= dbDashboards.getCollection('dashboards');
	snippets	= dbSnippets.getCollection('snippets');
	var query = { 'user_id': req.session.user.id };
	var d = dashboards.chain().find(query).sort(alphaSort).data();
	var s = snippets.chain().find(query).sort(alphaSort).data();
	res.render('dashboards/add', {
		title : 'Add a Dashboard',
		message: {},
		dashboards: d,
		new_dashboard: {snippets:[]},
		user: req.session.user,
		snippets: s,
		nl2br: nl2br,
		currentUrl: req.path,
		striptags: striptags
	});
});

router.post('/dashboards/add', Auth, function(req, res) {
	dashboards	= dbDashboards.getCollection('dashboards');
	snippets	= dbSnippets.getCollection('snippets');
	var error = undefined;
	var user_id = req.bearer!==undefined?req.bearer.user_id:req.session.bearer!==undefined?req.session.bearer.user_id:null;
	var message = '';
	var linked_snippets = req.body['snippets[]']!==undefined?req.body['snippets[]']:new Array();
	if ( typeof linked_snippets !== 'object' ) linked_snippets = new Array(linked_snippets);

	var queryQ = { '$and': [  {'user_id' : user_id} ]};
	var dashboard_id = uuid.v4();
	var new_dashboard = {
		id:			dashboard_id,
		user_id:		user_id,
		snippets:		linked_snippets,
		layout: 		req.body.layout!==undefined?req.body.layout:null,
		name:			req.body.name!==undefined?req.body.name:null,
		description:	req.body.description!==undefined?req.body.description:null,
	};
	//console.log(new_dashboard);
	var i = (dashboards.find(queryQ)).length;
	if( i >= (quota[req.session.user.role]).dashboards ) {
		message = {type: 'danger', value: 'Over Quota!'};
		error = true;
	} else {
		if ( new_dashboard.name && new_dashboard.user_id ) {
			dashboards.insert(new_dashboard);
			db.save();
			message = {type: 'success', value: 'Dashboard <a href="/dashboards/'+new_dashboard.id+'">'+new_dashboard.name+'</a> successfully added.'};
			req.session.message = message;
		} else {
			message = {type: 'danger', value: 'Please give a name to your Dashboard!'};
			error = true;
		}
	}
	var query = { 'user_id': req.session.user.id };
	var pagination=12;
	req.query.page=req.query.page!==undefined?req.query.page:1;
	var offset = (req.query.page -1) * pagination;
	var d = dashboards.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data();
	var s = snippets.chain().find(query).sort(alphaSort).data();
	
	if ( error ) {
		res.render('dashboards/add', {
			title : 't6 Dashboards',
			dashboards: d,
			new_dashboard: new_dashboard,
			page: req.query.page,
			pagenb: Math.ceil(((dashboards.chain().find(query).data()).length) / pagination),
			user: req.session.user,
			snippets: s,
			message: message,
			currentUrl: req.path,
		});
	} else {
		res.redirect('/dashboards/'); //+new_dashboard.id
	}
});

router.post('/dashboards/(:dashboard_id)/setName', Auth, function(req, res) {
	var dashboard_id = req.params.dashboard_id;
	dashboards	= dbDashboards.getCollection('dashboards');
	if ( dashboard_id !== undefined && req.body.name == "name" && req.body.value !== undefined ) {
		var queryD = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : dashboard_id },
			]
		};
		var upd_dashboard = dashboards.findOne(queryD);
		if ( upd_dashboard ) {
			upd_dashboard.name = req.body.value;
			dashboards.update(upd_dashboard);
			db.save();
			res.status(200).send({ 'code': 200, message: 'Successfully updated', dashboard: (upd_dashboard).name });
		} else {
			var err = new Error('Not Found');
			err.status = 400;
			res.status(err.status || 500).render(err.status, {
				title : 'Error on upd_dashboard',
				user: req.session.user,
				err: err
			});
		}
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.post('/dashboards/(:dashboard_id)/setDescription', Auth, function(req, res) {
	var dashboard_id = req.params.dashboard_id;
	dashboards	= dbDashboards.getCollection('dashboards');
	if ( dashboard_id !== undefined && req.body.name == "description" && req.body.value !== undefined ) {
		var queryD = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : dashboard_id },
			]
		};
		var upd_dashboard = dashboards.findOne(queryD);
		if ( upd_dashboard ) {
			upd_dashboard.description = req.body.value;
			if ( dashboards.update(upd_dashboard) ) {
				db.save();
				res.status(200).send({ 'code': 200, message: 'Successfully updated', dashboard: (upd_dashboard).description });
			} else {
				var err = new Error('1 Internal Server Error');
				err.status = 500;
				res.status(err.status || 500).send(err.status, {
					title : 'Error on update/save',
					user: req.session.user,
					err: err
				});
			}
		} else {
			var err = new Error('2 Internal Server Error');
			console.log(err);
			err.status = 500;
			res.status(err.status || 500).send(err.status, {
				title : 'Error on upd_dashboard',
				user: req.session.user,
				err: err
			});
		}
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

router.get('/dashboards/?(:dashboard_id)?', Auth, function(req, res) {
	var dashboard_id = req.params.dashboard_id;
	dashboards	= dbDashboards.getCollection('dashboards');
	if ( dashboard_id !== undefined ) {
		var queryD = {
		'$and': [
				{ 'user_id': req.session.user.id },
				{ 'id' : dashboard_id },
			]
		};
		var json = {
			dashboard: dashboards.findOne(queryD)
		};
		if ( json.dashboard ) {
			//var s = (json.eqJoin(snippets.chain(), 'user_id', 'id').data())[0];
			// TODO, but let's do it simple for now:
			var snippetHtml = '';
			snippets = dbSnippets.getCollection('snippets');
			for( var i=0; i<(json.dashboard.snippets).length; i++ ) {
				var s = snippets.findOne({id: json.dashboard.snippets[i]});
				if ( s ) {
	 				var snippet = {
						title		: s.name!==undefined?s.name:'',
						type		: s.type,
						currentUrl	: req.path,
						user		: req.session.user,
						snippet		: s,
						graph_title:		req.query.title!==undefined?req.query.title:'Default Title',
						graph_startdate:	moment(req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd'), 'x').format('DD/MM/YYYY'),
						graph_startdate2:	req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd').format('x'),
						graph_enddate:		moment(req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd'), 'x').format('DD/MM/YYYY'),
						graph_enddate2:		req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd').format('x'),
						graph_max:			req.query.max!==undefined?req.query.max:'50',
						graph_ttl:			req.query.graph_ttl!==undefined?req.query.graph_ttl:'',
						graph_weekendAreas:	req.query.weekendAreas!==undefined?req.query.weekendAreas:'',
						graph_color:		req.query.color!==undefined?req.query.color:'#edc240',
						graph_fill:			req.query.fill!==undefined?req.query.fill:'false',
						graph_autorefresh:	req.query.autorefresh!==undefined?req.query.autorefresh:'false',
						graph_chart_type:	req.query.chart_type!==undefined?req.query.chart_type:'bars',
						graph_layout:		req.query.layout!==undefined?req.query.layout:12,
					};
					snippet.type = snippet.type!==undefined?snippet.type:'valuedisplay';
					res.render('./snippets/'+snippet.type, snippet, function(err, html) {
						if( !err ) snippetHtml += html;
					});
				} // Snippet not Found
			};
			var message = req.session.message!==null?req.session.message:null;
			req.session.message = null; // Force to unset
			var layout = json.dashboard.layout!==undefined?json.dashboard.layout:'onecolumn';
			// TODO Add more secure ay to check layout value
			res.render('dashboards/'+layout, {
				title : 'Dashboard',
				user: req.session.user,
				dashboard: json.dashboard,
				snippetHtml: snippetHtml,
				currentUrl: req.path,
				nl2br: nl2br,
				version: version,
			});
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
	}
});

router.get('/account/register', function(req, res) {
	res.render('register', {
		title : 'Register',
		currentUrl: req.path,
		user: req.session.user
	});
});

router.post('/account/register', function(req, res) {
	users	= db.getCollection('users');
	var my_id = uuid.v4();

	var new_user = {
		id:					my_id,
		firstName:			req.body.firstName!==undefined?req.body.firstName:'',
		lastName:			req.body.lastName!==undefined?req.body.lastName:'',
		email:				req.body.email!==undefined?req.body.email:'',
		role:				'user', // no admin creation from the Front-End dashboard
		subscription_date:  moment().format('x'),
	};
	if ( new_user.email && new_user.id ) {
		users.insert(new_user);
		var new_token = {
				user_id:			new_user.id,
				key:				passgen.create(64, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.'),
				secret:				passgen.create(64, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.'),
		        expiration:			'',
		};
		var tokens	= db.getCollection('tokens');
		tokens.insert(new_token);
		
		res.render('emails/welcome', {user: new_user, token: new_token}, function(err, html) {
			var to = new_user.firstName+' '+new_user.lastName+' <'+new_user.email+'>';
			var mailOptions = {
				from: from,
				bcc: bcc,
				to: to,
				subject: 'Welcome to t6',
				text: 'Html email client is required',
				html: html
			};
			transporter.sendMail(mailOptions, function(err, info){
			    if( err ){
					var err = new Error('Internal Error');
					err.status = 500;
					res.status(err.status || 500).render(err.status, {
						title : 'Internal Error'+app.get('env'),
						user: req.session.user,
						err: err
					});
			    } else {
			    	res.render('login', {
					title : 'Login to t6',
					user: req.session.user,
					currentUrl: req.path,
					message: {type: 'success', value: 'Account created successfully. Please, check your inbox!'}
				});
			    }
			});
		});
		
		//res.redirect('/profile');
	} else {
		res.render('register', {
			title : 'Register',
			user: req.session.user,
			currentUrl: req.path,
			message: {type: 'danger', value: 'Please, give me your name!'}
		});
	}
	
});

router.get('/mail/welcome', function(req, res) {
	var fake_user = req.session.user;
	var fake_token = {
		user_id:			fake_user.id,
		key:				passgen.create(64, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.'),
		secret:				passgen.create(64, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.'),
        expiration:			'',
	};
	res.render('emails/welcome', {
		title : '',
		baseUrl: baseUrl,
		user: fake_user,
		currentUrl: req.path,
		token: fake_token
	});
});

router.get('/account/login', function(req, res) {
	res.render('login', {
		title : 'Log-in',
		currentUrl: req.path,
		user: req.session.user
	});
});

router.get('/unauthorized', function(req, res) {
	res.render('unauthorized', {
		title : 'Unauthorized, Please log-in again to t6',
		currentUrl: req.path,
		user: req.session.user
	});
});

router.get('/account/logout', function(req, res) {
	req.session.destroy();
	req.session = undefined;
	delete req.session;
	res.redirect('back');
});

router.post('/account/login', Auth, function(req, res) {
	if ( !req.session.user ) {
		console.log("Error! invalid credentials, user not found");
		res.render('login', {
			title : 'Log-in Failed',
			currentUrl: req.path,
			user: req.session.user
		});
	} else {
		//console.log(req.session.user);
		if ( req.url == "/account/login" ) {
		//res.redirect('/dashboards');
			res.redirect('/account/profile');
		} else {
			res.redirect('back');
		}
	}
});

router.get('/features/:feature([0-9a-z\-]+)', function(req, res) {
	var feature = req.params.feature;
	res.render('features/'+feature, {
		title : 't6 Feature',
		currentUrl: req.path,
		user: req.session.user
	});
});

router.get('/plans', function(req, res) {
	qt		= dbQuota.getCollection('quota');
	res.render('plans', {
		title : 't6 Plans',
		currentUrl: req.path,
		quota: quota,
		user: req.session.user
	});
});

router.get('/status', function(req, res) {
	qt		= dbQuota.getCollection('quota');
	res.render('status', {
		title : 't6 API Status',
		currentUrl: req.path,
		quota: quota,
		user: req.session.user
	});
});

router.get('/snippets', Auth, function(req, res) {
	snippets	= dbSnippets.getCollection('snippets');
	qt		= dbQuota.getCollection('quota');
	var query = { 'user_id': req.session.user.id };
	var pagination=12;
	req.query.page=req.query.page!==undefined?req.query.page:1;
	var offset = (req.query.page -1) * pagination;
	var message = req.session.message!==null?req.session.message:null;
	req.session.message = null; // Force to unset

	var s = snippets.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data();
	if ( s.length == 0 ) {
		res.redirect('/snippets/add');
	} else {
		var snippets_length = (snippets.chain().find(query).data()).length;
		res.render('snippets/snippets', {
			title : 'My Snippets',
			snippets: s,
			snippets_length: snippets_length,
			page: req.query.page,
			pagenb: Math.ceil(snippets_length/pagination),
			user: req.session.user,
			currentUrl: req.path,
			message: message,
			quota : (quota[req.session.user.role])
		});
	}
});

router.get('/snippets/add', Auth, function(req, res) {
	snippets	= dbSnippets.getCollection('snippets');
	flows		= db.getCollection('flows');
	var query = { 'user_id': req.session.user.id };
	var f = flows.chain().find(query).sort(alphaSort).data();
	res.render('snippets/add', {
		title : 'Add a Snippet',
		message: {},
		flows: f,
		user: req.session.user,
		new_snippet: {},
		nl2br: nl2br,
		currentUrl: req.path,
		striptags: striptags
	});
});

router.post('/snippets/add', Auth, function(req, res) {
	var user_id = req.bearer!==undefined?req.bearer.user_id:req.session.bearer!==undefined?req.session.bearer.user_id:null;
	snippets	= dbSnippets.getCollection('snippets');
	flows		= db.getCollection('flows');
	var query = { 'user_id': req.session.user.id };
	var f = flows.chain().find(query).sort(alphaSort).data();
	var queryS = { '$and': [  {'user_id' : user_id} ]};
	var message = '';
	var error = undefined;
	if ( false || !user_id ) { // useless :-)
		res.status(412).send(new ErrorSerializer({'id': 1909,'code': 412, 'message': 'Precondition Failed'}).serialize());
	} else {
		var flows;
		if( req.body['flows[]'] instanceof Array ) {
			flows = req.body['flows[]']!==undefined?req.body['flows[]']:new Array();
		} else {
			flows = [req.body['flows[]']!==undefined?req.body['flows[]']:new Array()];
		}
		
		var snippet_id = uuid.v4();
		var new_snippet = {
			id:				snippet_id,
			user_id:		user_id,
			type:			req.body.type!==undefined?req.body.type:'valuedisplay',
			name:			req.body.name!==undefined?req.body.name:null,
			icon:			req.body.icon!==undefined?req.body.icon:null,
			color:			req.body.color!==undefined?req.body.color:null,
			flows:			flows,
			p:				{
				datatype: req.body['p[datatype]'],
				unit: req.body['p[unit]'],
				startdate: req.body['p[startdate]'],
				enddate: req.body['p[enddate]'],
				background: req.body['p[background]'],
				lineColor: req.body['p[lineColor]'],
				fillColor: req.body['p[fillColor]'],
				normalRangeColor: req.body['p[normalRangeColor]']
			}
		};
		//console.log(new_snippet);
		//res.status(200).send(new_snippet);
		var i = (snippets.find(queryS)).length;
		if( i >= (quota[req.session.user.role]).snippets ) {
			message = {type: 'danger', value: 'Over Quota!'};
			req.session.message = message;
			error = true;
		} else {
			if ( new_snippet.name ) {
				snippets.insert(new_snippet);
				db.save();
				message = {type: 'success', value: 'Snippet <a href="/snippets/'+new_snippet.id+'">'+new_snippet.name+'</a> successfully added to your library.'};
				req.session.message = message;
			} else {
				message = {type: 'danger', value: 'Please give a name to your Snippet!'};
				req.session.message = message;
				error = true;
			}
		}
		if ( error ) {
			var query = { 'user_id': req.session.user.id };
			var pagination=12;
			req.query.page=req.query.page!==undefined?req.query.page:1;
			var offset = (req.query.page -1) * pagination;
			res.render('snippets/add', {
				title : 't6 Snippets',
				snippets: snippets.chain().find(query).sort(alphaSort).offset(offset).limit(pagination).data(),
				flows: f,
				new_snippet: new_snippet,
				page: req.query.page,
				pagenb: Math.ceil(((snippets.chain().find(query).data()).length) / pagination),
				user: req.session.user,
				message: req.session.message,
				currentUrl: req.path,
			});
		} else {
			res.redirect('/snippets/'); //+new_snippet.id
		}
	}
});

router.get('/snippets/:snippet_id([0-9a-z\-]+)', function(req, res) {
	var snippet_id = req.params.snippet_id;
	snippets	= dbSnippets.getCollection('snippets');

	if ( snippet_id !== undefined ) {
		var queryS = { '$and': [ { 'user_id': req.session.user.id }, { 'id' : snippet_id }, ] };
		var json = (snippets.chain().find(queryS).limit(1).data())[0];
		if ( json ) {
			res.render('snippets/'+json.type, {
				title :				json.name,
				currentUrl:			req.path,
				user:				req.session.user,
				snippet:			json,
				graph_title:		req.query.title!==undefined?req.query.title:json.name,
				graph_startdate:	moment(req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd'), 'x').format('DD/MM/YYYY'),
				graph_startdate2:	req.query.startdate!==undefined?req.query.startdate:moment().subtract(1, 'd').format('x'),
				graph_enddate:		moment(req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd'), 'x').format('DD/MM/YYYY'),
				graph_enddate2:		req.query.enddate!==undefined?req.query.enddate:moment().add(1, 'd').format('x'),
				graph_max:			req.query.max!==undefined?req.query.max:'50',
				graph_ttl:			req.query.graph_ttl!==undefined?req.query.graph_ttl:'',
				graph_weekendAreas:	req.query.weekendAreas!==undefined?req.query.weekendAreas:'',
				graph_color:		req.query.color!==undefined?req.query.color:'#edc240',
				graph_fill:			req.query.fill!==undefined?req.query.fill:'false',
				graph_autorefresh:	req.query.autorefresh!==undefined?req.query.autorefresh:'false',
				graph_chart_type:	req.query.chart_type!==undefined?req.query.chart_type:'bars',
				graph_layout:		req.query.layout!==undefined?req.query.layout:12,
			});
		} else {
			var err = new Error('Not Found');
			err.status = 404;
			res.status(err.status || 500).render(err.status, {
				title : 'Not Found',
				user: req.session.user,
				err: err
			});
		}
		
	} else {
		var err = new Error('Not Found');
		err.status = 404;
		res.status(err.status || 500).render(err.status, {
			title : 'Not Found',
			user: req.session.user,
			err: err
		});
	}
});

function Auth(req, res, next) {
	users	= db.getCollection('users');
	tokens	= db.getCollection('tokens');
	flows	= db.getCollection('flows');

	var key = req.body.key;
	var secret = req.body.secret;
	if ( key && secret ) {
		//console.log("I have a Key and a Secret");
		var queryT = {
				'$and': [
							{ 'key': key },
							{ 'secret': secret },
							// TODO: expiration !! {'expiration': { '$gte': moment().format('x') }},
						]
					};
		var token = tokens.findOne(queryT);
		if ( token ) {
			// Connect Success
			//console.log("I have found a valid Token");
			var queryU = {
					'$and': [
								{ 'id': token.user_id },
							]
						};
			var user = users.findOne(queryU);
			if ( user ) {
				//console.log("I have found a valid User");
				var SESS_ID = passgen.create(64, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.');
				//console.log("I have created a SESS_ID: "+SESS_ID);

				req.session.user = user;
				req.session.token = '';
				req.session.bearer = token;
				// TODO: set permissions to 644 ; Should be 600 !!
				var permissions = new Array();
				(flows.find({'user_id':req.session.user.id})).map(function(p) {
					permissions.push( { flow_id: p.id, permission: p.permission } );
				}); // End permissions on all User Flows
				//console.log(permissions);
				
				req.session.bearer.permissions = permissions;
				req.session.user.permissions = req.session.bearer.permissions;
				req.session.user.mail_hash = md5(req.session.user.email);
				
				req.session.session_id = SESS_ID;
				//console.log(req.session);
				res.cookie('session_id', SESS_ID);
				next();
			} else {
				//console.log("I have not found a valid User");
				res.redirect('/unauthorized');
			}
		} else {
			// Invalid Credentials
			//console.log("I have not found a valid Token");
			res.redirect('/unauthorized');
		}
	} else {
		//console.log("I haven't any Key nor Secret");
		// trying to retrieve User from the session... if any...
		if ( req.session !== undefined && req.session.user !== undefined && req.session.user.id !== undefined ) {
			if( !(req.session && req.session.user) ) {				
				res.redirect('/unauthorized');
			} else {
				//console.log("I have a session_id: "+req.cookies.session_id);
				next();
			}
		} else {
			res.redirect('/unauthorized');
		}
	}
}

module.exports = router;