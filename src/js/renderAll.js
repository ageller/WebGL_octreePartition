// ///////////////////////////////////////////////////////
// I'd like to find some way to stop the promisses from d3.csv somehow, incase there are too many files being read in they become irrelevant
//
//
//

//this is the animation loop
function animate(time) {
	var s1 = new Date().getTime()/1000;
	params.stats.forEach(function(s){ s.begin();})
	update();
	render();
	params.stats.forEach(function(s){ s.end();})
	var s2 = new Date().getTime()/1000;
	//params.FPS = params.stats[0].fps();
	params.FPS = 1./(s2 - s1);

	requestAnimationFrame( animate );

}

function render(){
	params.renderer.render( params.scene, params.camera );
}


function update(){
	params.controls.update();


	//check if we should reset the draw buffer
	var dateCheck = new Date().getTime()/1000.
	if ((dateCheck - params.drawStartTime) > params.maxDrawInterval && params.drawPass > 100  && params.drawCount < params.toDraw.length){
		console.log('clearing drawing buffer', params.toDraw.length)
		params.drawStartTime = new Date().getTime()/1000;
		clearDrawer();
	}

	//check if we've successfully drawn all the particles
	if (params.drawCount >= params.drawIndex && params.drawIndex > 0) {
		console.log('done drawing', params.drawCount, params.drawIndex);
		clearDrawer();
	}

	//maybe I should create a promise structure here, or else I should have a setInterval to check when one is finished before moving on.
	//remove any nodes that are flagged for removal
	if (params.toRemove.length > 0) removeUnwantedNodes();

	//draw the nodes that are flagged for drawing
	if (params.toDraw.length > 0 && params.drawCount > params.drawIndex) drawWantedNodes();

	params.particleTypes.forEach(function(p){
		//first get all the sizes and sort
		var toSort = []
		var indices = []
		params.octreeNodes[p].forEach(function(node,i){
			//don't include any nodes that are marked for removal
			if (!params.toRemove.includes(p+node.id)){
				node.cameraDistance = params.camera.position.distanceTo( new THREE.Vector3( node.x, node.y, node.z) );
				//checkFrustum(node);

				setNodeScreenSize(node);
				//toSort.push(node.screenSize/node.cameraDistance);
				toSort.push(node.screenSize);
				indices.push(i);
			}
		});
		//sort from big to small
		indices.sort(function (a, b) { return toSort[a] > toSort[b] ? -1 : toSort[a] < toSort[b] ? 1 : 0; });

		//now render
		indices.forEach(function(index){

			var node = params.octreeNodes[p][index];

			//if we've reached the maximum draw length, the start replacing files?
			if (params.toDraw.length >= params.maxFilesToRead) 	params.indexToAddToDraw = (params.indexToAddToDraw + 1) % params.maxFilesToRead;

			//decide how many particles to show in the screen for that node
			//assume we have particles at default pixel minimum size
			var prevNparticlesToRender = node.NparticlesToRender; //save this so that I can correct the total particles drawn

			node.NparticlesToRender = Math.max(1., Math.min(node.Nparticles, Math.floor(node.screenSize*node.screenSize/(params.defaultMinParticleSize*params.defaultMinParticleSize)*params.NParticleFPSModifier)));

			var drewNew = false;
			// if the node should be drawn
			if (node.screenSize >= params.minNodeScreenSize && !params.alreadyDrawn.includes(p+node.id) && params.FPS >= params.minFPS ){
				//console.log('drawing node', p, node.id, node.NparticlesToRender, node.Nparticles)
				node.showing = true;
				drewNew = true;
				if (params.toDraw.length < params.maxFilesToRead){
					params.alreadyDrawn.push(p+node.id);
					params.toDraw.push([p, node.id, false]);
					params.toDrawIDs.push(p+node.id);
				} else {
					//params.toDraw[params.indexToAddToDraw] = [p, node.id, false];
					//params.toDrawIDs[params.indexToAddToDraw] = p+node.id;
				}
			}

			//if the node should be removed
			if (node.screenSize < params.minNodeScreenSize && params.alreadyDrawn.includes(p+node.id)){
				node.showing = false;
				var obj = params.scene.getObjectByName(p+node.id);
				if (obj) params.toRemove.push(obj.name); //will be removed later
				
				node.particles = [];

				//remove from already drawn list
				const index = params.alreadyDrawn.indexOf(p+node.id);
				if (index > -1) params.alreadyDrawn.splice(index, 1);
				//console.log('removed node', p, node.id)
			}

			//if we need to update the number of particles drawn in the node
			//it seems like this the NparticlesToRender is not set correctly on the first few draw passes??
			if (params.alreadyDrawn.includes(p+node.id) && !params.toDrawIDs.includes(p+node.id) && !drewNew && prevNparticlesToRender != node.NparticlesToRender && params.drawPass > 5){

				//console.log('check', prevNparticlesToRender, node.Nparticles, node.NparticlesToRender)	
				var obj = params.scene.getObjectByName(p+node.id);

				//if we already have enough particles in memory, just adjust the max number in the shader
				//I am a bit worried that this still keeps the particles in there and slows the frame rate
				if (obj){
					obj.material.uniforms.maxToRender.value = node.NparticlesToRender;
					obj.material.needsUpdate = true;
					if (node.particles.length >= node.NparticlesToRender) node.particles = node.particles.slice(0, node.NparticlesToRender);
					if (params.toDraw.length < params.maxFilesToRead){
						params.toDraw.push([p, node.id, true]); //will be updated later
						params.toDrawIDs.push(p+node.id);
					} else {
						//params.toDraw[params.indexToAddToDraw] = [p, node.id, true];
						//params.toDrawIDs[params.indexToAddToDraw] = p+node.id;
					}
				}
			}

		})
	})
	
	params.drawPass += 1;``

	//if (params.stats[0].fps() < params.minFPS) console.log('!!! Reached maximum draw limit', params.totalParticlesDrawn, params.stats[0].fps())

	//tweak the number of particles based on the fps
	//not sure what limits I should set here
	if (params.FPS >= params.targetFPS) params.NParticleFPSModifier = Math.min(1, params.NParticleFPSModifier*1.5);// + 0.1);
	if (params.FPS < params.minFPS) params.NParticleFPSModifier = Math.max(0.01, params.NParticleFPSModifier*0.5);// - 0.1);
	//console.log('total particles drawn',params.totalParticlesDrawn)
}

function clearDrawer(){
	params.drawCount = 0;
	params.drawIndex = -1;
	params.toDraw = [];
	params.toDrawIDs = [];
	params.readPromisses = [];
}

function removeUnwantedNodes(){
	console.log('removing', params.toRemove.length);
	params.toRemove.forEach(function(name){
		var obj = params.scene.getObjectByName(name);
		while(obj){
			params.scene.remove(obj);
			obj = params.scene.getObjectByName(name);
		}
	});
	params.toRemove = [];
}

function drawWantedNodes(){
	console.log('drawing', params.toDraw.length);
	params.drawCount = 0;
	params.drawIndex = params.toDraw.length;
	params.toDraw.forEach(function(arr){
		var p = arr[0];
		var iden = arr[1];
		var updateGeo = arr[2];
		var node = null;
		params.octreeNodes[p].forEach(function(n){
			if (n.id == iden) node = n;
		})
		if (node) drawNode(p, node, updateGeo);
	})
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
	if (!isFinite(xwidth)) xwidth = 0.;

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
	if (!isFinite(ywidth)) ywidth = 0.;

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
	if (!isFinite(zwidth)) zwidth = 0.;

	//return a fraction of the screen size
	var width = Math.max(xwidth, Math.max(ywidth, zwidth));

	//this will be a width in pixels
	node.screenSize = width

	//this will be a normalized width between 0 and 1 (by what should I normalize to)
	//node.screenSize = width/((window.innerWidth + window.innerHeight)/2.)
}



function checkNodes(p){
	//to check in console
	params.octreeNodes[p].forEach(function(node){
		if (node.inFrustum) console.log(node.cameraDistance, node.inFrustum, node.screenSize, node.showing)
	})
}