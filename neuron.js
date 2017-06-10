"use strict";

document.addEventListener("DOMContentLoaded", startBabylonJS, false);

// General inicialisation
var initBabylon = function (){
	if (!BABYLON.Engine.isSupported()) return false;
	
	var canvas 	= document.getElementById("renderCanvas");

	var engine 	= new BABYLON.Engine(canvas, true);
	engine.enableOfflineSupport = false;

	var scene 	= new BABYLON.Scene(engine);

	var light	= new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 10, 0), scene);
	
	var camera	= new BABYLON.ArcRotateCamera("camera1", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
	camera.setPosition(new BABYLON.Vector3(-20, 55, 40));
	camera.attachControl(canvas, true);

    engine.runRenderLoop(function () {
		scene.render();
	});
	
	window.addEventListener("resize", function () {
		engine.resize();
	});
	
	var context = {
		canvas	: canvas,
		engine	: engine,
		scene 	: scene,
		light	: light,
		camera	: camera
	};
	
	return context;
}

// Optimized cubic Bézier function
// Return path of the vertex between origin and destination curved by control vertices
//
// cubicBezier(vector3Origin, vector3Control1, vector3Control2, vector3Destination, segmentNumber)
var cubicBezier = function(v0, v1, v2, v3, nb) {
	var bez = [];
	var step = 1 / nb;
	var t = 0;
	var t2 = 0;
	var t3 = 0;

	for(;t<= 1;t+=step,t2=t*t,t3=t2*t) {
		var a = 1-3*t+3*t2-t3;
		var b = 3*(t-2*t2+t3);
		var c = 3*(t2-t3);
		
		bez.push(
			new BABYLON.Vector3(
				v0.x*a + v1.x*b	+ v2.x*c + v3.x*t3,
				v0.y*a + v1.y*b	+ v2.y*c + v3.y*t3,
				v0.z*a + v1.z*b	+ v2.z*c + v3.z*t3	
			)
		);
	}

	bez.push(v3);
	return bez;
};

/** Class for 3D axons - curved horn with optional lights
 * @param {string} name - Name of the axon's mesh
 * @param {BABYLON.Vector3} start - Starting point
 * @param {BABYLON.Vector3} end - Ending point
 * @param {BABYLON.Scene} scene - Scene to put axon
 */
function axon3D(name,start,end,scene){
	this.start = start;
	this.diff = end.subtract(start);
	
	// Make axon curved by putting two control points for cubic Bézier
	this.control1 = start.add(
		new BABYLON.Vector3(
			 2*this.diff.y/3,
			-2*this.diff.x/3,
			 2*this.diff.z/3
		)
	);
	this.control2 = start.add(
		new BABYLON.Vector3(
			 3*this.diff.x/4,
			-3*this.diff.z/4,
			 3*this.diff.y/4
		)
	);

	this.end = end;
	this.p = null;
	this.tube = null;
	this.maxCycles = 50;
	
	// Make lights cycles random
	this.cycles = Math.floor(Math.random() * 8 * this.maxCycles);
	
	// Use cubic Bézier function to calculate axon's path
	this.path = function (){
		this.p = cubicBezier(this.start,this.control1,this.control2,this.end,this.maxCycles);
		return this.p;
	}
	
	// Use hyberbolic function for axon's radius
	this.radius = function(i, distance){
		return 5/(i+4);
	}
	
	// This function draws "light" as a small sphere` moving over axon
	this.light = function (){
		this.cycles+=3;
		if(this.cycles>=this.maxCycles*10){
			this.cycles = 0;
			this.sphere.scaling.x = 1;
			this.sphere.scaling.y = 1;
			this.sphere.scaling.z = 1;
		}
		if (this.cycles < this.maxCycles) {
			this.sphere.position = this.p[this.cycles];
		}
		if(this.cycles >= this.maxCycles) {
			this.sphere.scaling.x = 0.1;
			this.sphere.scaling.y = 0.1;
			this.sphere.scaling.z = 0.1;
		}
		
	}
	
	// Create "light" sphere
	this.sphere = BABYLON.Mesh.CreateSphere(name+"_light", 16, 1, scene);
	
	// Create axon as a tube
	this.tube = BABYLON.Mesh.CreateTube(name+"_tube", this.path(), 2, 60, this.radius, BABYLON.Mesh.CAP_ALL, scene, true, BABYLON.Mesh.FRONTSIDE);
}

/** Class for 3D neuron center with axons towards sinapses
 * @param {string} name - Name of the neuron
 * @param {BABYLON.Vector3} center - center point of the neuron
 * @param {BABYLON.Vector3[]} endPoints - Array of the axon's ending points
 * @param {number} radius - Radius of the central part of the neuron
 * @param {BABYLON.Scene} scene - Scene to put axon
 */
function neuron3D(name,center,endPoints,radius,scene){
	this.name = name;
	this.center = center;
	this.scene = scene;
	
	// curved tubes
	this.axons = [];

	// coordinates of endPoints
	this.endPoints = endPoints;
	
	// spheres at the end of tubes
	this.sinaps = [];
	
	// Create axons
	endPoints.forEach(function(point,index){
		this.axons.push(new axon3D(name+"_"+index,center,point,scene));
	},this);
	
	// Light up axons - all or by index
	this.light = function (index){
		if(index == null){
			this.axons.forEach(function(axon,index){
				axon.light();
			},this);
		} else {
			this.axons[index].light();
		}
	}
	
	// Sphere at the end of axon
	this.showSinaps = function (index){
		if(index == null){
			this.endPoints.forEach(function(point,index){
				var sphere = BABYLON.Mesh.CreateSphere(this.name + "_sinaps_"+index, 16, 1, this.scene);
				sphere.position = point;
				this.sinaps.push(sphere);
			},this);
		} else {
				var sphere = BABYLON.Mesh.CreateSphere(this.name + "_sinaps_"+index, 16, 1, this.scene);
				sphere.position = endPoints[index];
				this.sinaps.push(sphere);
		}
	}
	
	this.nucleus = BABYLON.Mesh.CreateSphere(name+"_central_sphere", 16, radius, scene);
	this.nucleus.position = center;
	
	this.material = function(matNeuron){
		this.nucleus.material = matNeuron;
		
		this.axons.forEach(function(axon,index){
			axon.tube.material = matNeuron;
		},this);
		
		this.sinaps.forEach(function(sin,index){
			sin.material = matNeuron;
		},this);
	}
}

function startBabylonJS() {
	var context = initBabylon();
	
	if (context == false	) {
		alert("Sorry, your browser does not support 3D");
		return;
	}
	
	var scene = context.scene;
	var light = context.light;
	var camera = context.camera;
	
	// Material for sinapses
	// Bump texture with purple color
	var mat = new BABYLON.StandardMaterial("default", scene);
	mat.diffuseColor = new BABYLON.Color3(1,0.5,1);
    mat.bumpTexture = new BABYLON.Texture("NormalMapM.png", scene);
    mat.bumpTexture.level = 1;
	mat.specularColor = new BABYLON.Color3(1,0,1);

	// Emissive material for electric light
	var matSphere = new BABYLON.StandardMaterial("default", scene);
	matSphere.emissiveColor = new BABYLON.Color3(.3,0,1);


	var center = new BABYLON.Vector3(  0, 0, 0);
	
	var neuron1 = new neuron3D(
		"neuron1",
		new BABYLON.Vector3( 0, 0, 0),
		[
			new BABYLON.Vector3(  20,  0, 20),
			new BABYLON.Vector3( -20, 0,  20),
			new BABYLON.Vector3( 10, -20,  -10),
			new BABYLON.Vector3( 0, 20,  -20)
		],
		5,
		scene
	);
	
	var neuron2 = new neuron3D(
		"neuron2",
		new BABYLON.Vector3(  20,  0, 20),
		[
			new BABYLON.Vector3(  30,  10, 20),
			new BABYLON.Vector3(  20,  -10, 30)
		],
		3,
		scene
	);
	
	var neuron3 = new neuron3D(
		"neuron3",
		new BABYLON.Vector3(  -20,  0, -20),
		[
			new BABYLON.Vector3(  -30,  -10, -20),
			new BABYLON.Vector3(  -20,  10, -30),
			new BABYLON.Vector3(  -10,  0, -10)
		],
		3,
		scene
	);
	
	neuron1.showSinaps();
	neuron2.showSinaps();
	
	neuron1.material(mat);
	neuron2.material(mat);
	neuron3.material(mat);	

	var light1	= new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(5, 5, 5), scene);
	
	var maxCycles = 50;
	var cycles = maxCycles;

	var cameraPath = cubicBezier(
		new BABYLON.Vector3(-20, 55, 40),
		new BABYLON.Vector3(-30, 80, 20),
		new BABYLON.Vector3(30, -80, 20),
		new BABYLON.Vector3(-100, -40, 100),
		500
	);
	var initialCycles = cameraPath.length - 1;
	
	scene.registerBeforeRender(function(){
		neuron1.light();
		neuron2.light();
		light.position = camera.position;

		if(cycles++>=maxCycles){
			cycles = 0;
			maxCycles = 200*Math.random();
			//light1.setEnabled(1);
		}
		if(cycles > 40) {
			//light1.setEnabled(0);
		}
		
		if(initialCycles-->0){
			camera.setPosition(new BABYLON.Vector3(cameraPath[initialCycles].x,cameraPath[initialCycles].y,cameraPath[initialCycles].z));
		}
	});
}