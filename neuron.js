"use strict";

document.addEventListener("DOMContentLoaded", startBabylonJS, false);

var canvas;
var engine;
var scene;
var light;
var light1;
var camera;
var cameraPath;

var makeTextPlane = function(text, color, size) {
	var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
	dynamicTexture.hasAlpha = true;
	dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
	var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
	plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
	plane.material.backFaceCulling = false;
	plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
	plane.material.diffuseTexture = dynamicTexture;
	return plane;
};

// show axis
var showAxis = function(size) {


	var axisX = BABYLON.Mesh.CreateLines("axisX", [ 
		new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0), 
		new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
	], scene);
	axisX.color = new BABYLON.Color3(1, 0, 0);
	var xChar = makeTextPlane("X", "red", size / 10);
	xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
	var axisY = BABYLON.Mesh.CreateLines("axisY", [
		new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0), 
		new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
	], scene);
	axisY.color = new BABYLON.Color3(0, 1, 0);
	var yChar = makeTextPlane("Y", "green", size / 10);
	yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
	var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
		new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
		new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
	], scene);
	axisZ.color = new BABYLON.Color3(0, 0, 1);
	var zChar = makeTextPlane("Z", "blue", size / 10);
	zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
};
	

var initBabylon = function (){
	if (!BABYLON.Engine.isSupported()) return false;
	
	canvas 	= document.getElementById("renderCanvas");

	engine 	= new BABYLON.Engine(canvas, true);
	engine.enableOfflineSupport = false;

	scene 	= new BABYLON.Scene(engine);

	light	= new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	
	camera	= new BABYLON.ArcRotateCamera("camera1", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
	camera.setPosition(new BABYLON.Vector3(-20, 55, 40));
	camera.attachControl(canvas, true);

	return true;
}

// cubic Bézier function
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

function sinaps3D(start,end){
	this.start = start;
	this.diff = end.subtract(start);
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
	this.cycles = Math.floor(Math.random() * 8 * this.maxCycles);
	
	this.path = function (){
		this.p = cubicBezier(this.start,this.control1,this.control2,this.end,this.maxCycles);
		return this.p;
	}
	
	this.radius = function(i, distance){
		return 5/(i+4);
	}
	
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
	this.sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene);
	this.tube = BABYLON.Mesh.CreateTube("tube", this.path(), 2, 60, this.radius, BABYLON.Mesh.CAP_ALL, scene, true, BABYLON.Mesh.FRONTSIDE);
}


function startBabylonJS() {
	if (!initBabylon()) {
		alert("Sorry, your browser does not support 3D");
		return;
	}
	
	// material
	var matSphere = new BABYLON.StandardMaterial("default", scene);
	matSphere.emissiveColor = new BABYLON.Color3(.3,0,1);

	var mat = new BABYLON.StandardMaterial("default", scene);
	mat.diffuseColor = BABYLON.Color3.Purple();
    mat.bumpTexture = new BABYLON.Texture("NormalMapM.png", scene);
    mat.bumpTexture.level = 3;
	mat.specularColor = new BABYLON.Color3(1,0,1);

	var center = new BABYLON.Vector3(  0, 0, 0);
	var points = [
		new BABYLON.Vector3(  20,  0, 20),
		new BABYLON.Vector3( -20, 0,  20),
		new BABYLON.Vector3( 10, -20,  -10),
		new BABYLON.Vector3( 0, 20,  -20),
		new BABYLON.Vector3(  30,  10, 20),
		new BABYLON.Vector3(  20,  -10, 30)
	];
	
	var sinaps  = new sinaps3D(center,points[0]);
	var sinaps1 = new sinaps3D(center,points[1]);
	var sinaps2 = new sinaps3D(center,points[2]);
	var sinaps3 = new sinaps3D(center,points[3]);

	var sinaps4 = new sinaps3D(points[0],points[4]);
	var sinaps5 = new sinaps3D(points[0],points[5]);
	
	sinaps.sphere.material = matSphere;
	sinaps.tube.material = mat;
	
	sinaps1.sphere.material = matSphere;
	sinaps1.tube.material = mat;

	sinaps2.sphere.material = matSphere;
	sinaps2.tube.material = mat;

	sinaps3.sphere.material = matSphere;
	sinaps3.tube.material = mat;

	sinaps4.sphere.material = matSphere;
	sinaps4.tube.material = mat;

	sinaps5.sphere.material = matSphere;
	sinaps5.tube.material = mat;

	
	var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 5, scene);
	sphere.position = center;
	sphere.material = mat;

	var sphere1 = BABYLON.Mesh.CreateSphere("sphere1", 16, 3, scene);
	sphere1.position = points[0];
	sphere1.material = mat;

	var sphere2 = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene);
	sphere2.position = points[1];
	sphere2.material = mat;
	
	var sphere2 = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene);
	sphere2.position = points[2];
	sphere2.material = mat;
	
	var sphere2 = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene);
	sphere2.position = points[3];
	sphere2.material = mat;

	var sphere2 = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene);
	sphere2.position = points[4];
	sphere2.material = mat;

	var sphere2 = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene);
	sphere2.position = points[5];
	sphere2.material = mat;	

	light1	= new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(5, 5, 5), scene);

	
	var maxCycles = 50;
	var cycles = maxCycles;
	
	//scene.debugLayer.show();
	//showAxis(20);

	cameraPath = cubicBezier(
		new BABYLON.Vector3(-20, 55, 40),
		new BABYLON.Vector3(-30, 80, 20),
		new BABYLON.Vector3(30, -80, 20),
		new BABYLON.Vector3(-100, -40, 100),
		50
	);
	var initialCycles = cameraPath.length - 1;

	
	scene.registerBeforeRender(function(){
		sinaps.light();
		sinaps1.light();
		sinaps2.light();
		sinaps3.light();
		sinaps4.light();
		sinaps5.light();
		light.position = camera.position;

		cycles+=1;
		if(cycles>=maxCycles){
			cycles = -2;
			maxCycles = 200*Math.random();
			light1.setEnabled(1);
		}
		if(cycles > 2) {
			sphere.scaling.x = 1;
			sphere.scaling.y = 1;
			sphere.scaling.z = 1;
			light1.setEnabled(0);
		} else {
			sphere.scaling.x = 1+(2-Math.abs(cycles))*0.05;
			sphere.scaling.y = 1+(2-Math.abs(cycles))*0.05;
			sphere.scaling.z = 1+(2-Math.abs(cycles))*0.05;
		}
		
		if(initialCycles-->0){
			camera.setPosition(new BABYLON.Vector3(cameraPath[initialCycles].x,cameraPath[initialCycles].y,cameraPath[initialCycles].z));
		}
	});
	
    engine.runRenderLoop(function () {
		scene.render();
	});
	
	window.addEventListener("resize", function () {
		engine.resize();
	});

}