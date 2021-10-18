//this is the animation loop
function animate(time) {
	requestAnimationFrame( animate );
	update();
	render();
}

function render(){
	params.renderer.render( params.scene, params.camera );
}


function update(){
	params.controls.update();

	//for frustum check
	//https://stackoverflow.com/questions/29758233/three-js-check-if-object-is-still-in-view-of-the-camera
	params.camera.updateMatrix();
	params.camera.updateMatrixWorld();
	params.frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(params.camera.projectionMatrix, params.camera.matrixWorldInverse));  
	//maybe I don't need to frustum check?

	//maybe I can use the internal frustum culling? (not implemented)
	//This might work for removing a node that is already plotted, but wouldn't work for adding nodes (since they would not be in the scene)
	//but I will use this to build params.totalParticlesDrawn 
	//generally, I may not need any frustum check since three.js is doing that anyway
	//https://github.com/mrdoob/three.js/issues/15339
	params.totalParticlesDrawn = 0;
	params.scene.traverse(function(obj){
		if (obj.isMesh || obj.isPoints) {
			if (params.frustum.intersectsObject(obj)) params.totalParticlesDrawn += obj.material.uniforms.maxToRender.value;
		}
	});

	//check if any of the nodes are close enough to draw (or could do this based on fps?)
	params.octreeNodes.forEach(function(node){
		node.cameraDistance = params.camera.position.distanceTo( new THREE.Vector3( node.x, node.y, node.z) );
		//checkFrustum(node);

		setNodeScreenSize(node);

		//decide how many particles to show in the screen for that node
		//assume we have particles at 3 pixel minimum size
		var prevNparticlesToRender = node.NparticlesToRender; //save this so that I can correct the total particles drawn
		node.NparticlesToRender = Math.min(node.Nparticles, Math.floor(node.screenSize*node.screenSize/9.));

		var drewNew = false;
		//it seems like there are multiple draw calls for the same node.  I'm trying to fix that...
		//if (node.screenSize >= params.minNodeScreenSize && node.inFrustum && !params.fullyDrawn.includes(node.id) && params.totalParticlesDrawn <= params.maxParticlesToDraw){
		// if the node should be drawn ...
		if (node.screenSize >= params.minNodeScreenSize && !params.fullyDrawn.includes(node.id) && (params.totalParticlesDrawn + node.NparticlesToRender) <= params.maxParticlesToDraw){
			console.log('drawing node', node.id, params.totalParticlesDrawn, node.Nparticles, node.NparticlesToRender)
			//draw the particles in the node
			node.showing = true;
			drewNew = true;
			if (!params.drawing) {
				params.fullyDrawn.push(node.id);
				params.totalParticlesDrawn += node.NparticlesToRender;
				drawNode(node.id, [ 1, 1, 1, 1], node.id, 1, node.Nparticles, params.defaultMinParticlesSize, node.NparticlesToRender);
			}
		}

		//if ((node.screenSize < params.minNodeScreenSize || !node.inFrustum) && params.fullyDrawn.includes(node.id)){
		//if the node should be removed ...
		if (node.screenSize < params.minNodeScreenSize  && params.fullyDrawn.includes(node.id)){
			//remove the particles in the node (though this will still keep the initial particle to mark the node location)
			node.showing = false;
			var obj = params.scene.getObjectByName(node.id);

			//trying to fix the multiple draw issue...
			while (obj){
				params.scene.remove(obj);
				var obj = params.scene.getObjectByName(node.id);
				const index = params.fullyDrawn.indexOf(node.id);
				if (index > -1) params.fullyDrawn.splice(index, 1);
				params.totalParticlesDrawn -= prevNparticlesToRender;
			}

			console.log('removed node', node.id, params.totalParticlesDrawn)
		}

		//update the number of particles to draw if necesarry
		if (params.fullyDrawn.includes(node.id) && !drewNew){
			var obj = params.scene.getObjectByName(node.id);
			if (obj){
				if (obj.material.uniforms.maxToRender.value != node.NparticlesToRender && 	(params.totalParticlesDrawn + node.NparticlesToRender - prevNparticlesToRender) <= params.maxParticlesToDraw){
					obj.material.uniforms.maxToRender.value = node.NparticlesToRender;
					obj.material.needsUpdate = true;
					params.totalParticlesDrawn += (node.NparticlesToRender - prevNparticlesToRender);
					console.log('updated particles to render', node.id, node.NparticlesToRender)
				}
			}
		}
	})

	if (params.totalParticlesDrawn >= params.maxParticlesToDraw) console.log('!!! Reached maximum draw limit', params.totalParticlesDrawn, params.maxParticlesToDraw)
}

function checkFrustum(node){
	//currently not used

	//this mostly works, but I've seen some strange behavior near the frustum edges

	//check if any of the corners is within the frustum
	//I might be able to speed this up if I put a return right after setting inFrustum to true
	var p;

	var inFrustum = false;
	p = new THREE.Vector3( node.x + node.xWidth/2., node.y + node.yWidth/2., node.z + node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x - node.xWidth/2., node.y + node.yWidth/2., node.z + node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x + node.xWidth/2., node.y - node.yWidth/2., node.z + node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x - node.xWidth/2., node.y - node.yWidth/2., node.z + node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x + node.xWidth/2., node.y + node.yWidth/2., node.z - node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x - node.xWidth/2., node.y + node.yWidth/2., node.z - node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x + node.xWidth/2., node.y - node.yWidth/2., node.z - node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	p = new THREE.Vector3( node.x - node.xWidth/2., node.y - node.yWidth/2., node.z - node.zWidth/2.);
	if (params.frustum.containsPoint(p)) inFrustum = true;

	node.inFrustum = inFrustum;

}

function setNodeScreenSize(node){
//https://discourse.threejs.org/t/how-to-converting-world-coordinates-to-2d-mouse-coordinates-in-threejs/2251

	//estimate the screen size by taking the max of the x,y,z widths
	//x width
	var x1 = new THREE.Vector3(node.x - node.width/2., node.y, node.z);
	x1.project(params.camera);
	x1.x = (x1.x + 1)*window.innerWidth/2.;
	x1.y = (x1.y - 1)*window.innerHeight/2.;
	x1.z = 0;
	var x2 = new THREE.Vector3(node.x + node.width/2., node.y, node.z);
	x2.project(params.camera);
	x2.x = (x2.x + 1)*window.innerWidth/2.;
	x2.y = (x2.y - 1)*window.innerHeight/2.;
	x2.z = 0;
	var xwidth = x1.distanceTo(x2);	

	//y width
	var y1 = new THREE.Vector3(node.x, node.y - node.width/2., node.z);
	y1.project(params.camera);
	y1.x = (y1.x + 1)*window.innerWidth/2.;
	y1.y = (y1.y - 1)*window.innerHeight/2.;
	y1.z = 0;
	var y2 = new THREE.Vector3(node.x, node.y + node.width/2., node.z);
	y2.project(params.camera);
	y2.x = (y2.x + 1)*window.innerWidth/2.;
	y2.y = (y2.y - 1)*window.innerHeight/2.;
	y2.z = 0;
	var ywidth = y1.distanceTo(y2);	

	//x width
	var z1 = new THREE.Vector3(node.x, node.y, node.z - node.width/2.);
	z1.project(params.camera);
	z1.x = (z1.x + 1)*window.innerWidth/2.;
	z1.y = (z1.y - 1)*window.innerHeight/2.;
	z1.z = 0;
	var z2 = new THREE.Vector3(node.x, node.y, node.z + node.width/2.);
	z2.project(params.camera);
	z2.x = (z2.x + 1)*window.innerWidth/2.;
	z2.y = (z2.y - 1)*window.innerHeight/2.;
	z2.z = 0;
	var zwidth = z1.distanceTo(z2);	

	//return a fraction of the screen size
	var width = Math.max(xwidth, Math.max(ywidth, zwidth));

	//this will be a width in pixels
	node.screenSize = width

	//this will be a normalized width between 0 and 1 (by what should I normalize to)
	//node.screenSize = width/((window.innerWidth + window.innerHeight)/2.)
}



function checkNodes(){
	//to check in console
	params.octreeNodes.forEach(function(node){
		if (node.inFrustum) console.log(node.cameraDistance, node.inFrustum, node.screenSize, node.showing)
	})
}