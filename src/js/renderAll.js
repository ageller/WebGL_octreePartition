// ///////////////////////////////////////////////////////
// I'd like to find some way to stop the promisses from d3.csv somehow, incase there are too many files being read in they become irrelevant
// maybe I should allow nodes that are closer to the camera to have a higher render amount?
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
	//params.FPS = 1./(s2 - s1);
	//take a moving average
	//var FPSNow = 1./(s2 - s1);
	var FPSNow = params.stats[0].fps();
	//taking moving averages of every params.FPSmod frames to avoid cyclic jumps in particle sizes
	var norm = params.drawPass % params.FPSmod
	if (norm > 0 && FPSNow > 0) params.FPS = ((norm - 1.)*params.FPS + FPSNow)/norm;
	if (!isFinite(params.FPS)) {
		console.log('Warning bad FPS', params.FPS)
		params.FPS = params.targetFPS;
	}
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
		clearRemover();
	}

	//check if we've successfully drawn all the particles
	if (params.drawCount >= params.drawIndex && params.drawIndex > 0) {
		console.log('done drawing', params.drawCount, params.drawIndex);
		clearDrawer();
	}


	//check if we've successfully re moved all the particles
	if (params.removeCount >= params.removeIndex && params.removeIndex > 0) {
		console.log('done removing', params.removeCount, params.removeIndex);
		clearRemover();
	}
	//remove any nodes that are flagged for removal
	if (params.toRemove.length > 0 && params.removeCount > params.removeIndex) removeUnwantedNodes();

	//draw the nodes that are flagged for drawing
	if (params.toDraw.length > 0 && params.drawCount > params.drawIndex) drawWantedNodes();

	//check if the object is in view (if not, we won't draw and can remove; though note that this will not pick up new nodes that shouldn't be drawn)
	//https://github.com/mrdoob/three.js/issues/15339
	params.camera.updateMatrix();
	params.camera.updateMatrixWorld();
	params.frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(params.camera.projectionMatrix, params.camera.matrixWorldInverse));  


	//tweak the number of particles based on the fps
	//not sure what limits I should set here
	params.NParticleFPSModifier = Math.max(0.01, Math.min(1., params.FPS/params.targetFPS));

	//console.log('total particles drawn',params.totalParticlesDrawn)
	//rather than a for loop to go through the particles, I am going to manually iterate so that I can draw from one each draw pass
	//this way the scene gets filled in more regularly, instead of filling in one particle group at a time
	var p = params.particleTypes[params.pIndex];


	//first get all the sizes and distances and sort
	var toSort = []
	var indices = []
	params.octreeNodes[p].forEach(function(node,i){
		setNodeDrawParams(node);

		//don't include any nodes that are marked for removal
		if (!params.toRemoveIDs.includes(p+node.id)){
			toSort.push(node.camerDistance);
			//toSort.push(node.screenSize/node.cameraDistance);
			indices.push(i);
		}
	});
	//sort from big to small
	//indices.sort(function (a, b) { return toSort[a] > toSort[b] ? -1 : toSort[a] < toSort[b] ? 1 : 0; });
	//sort from small to big
	indices.sort(function (a, b) { return toSort[a] < toSort[b] ? -1 : toSort[a] > toSort[b] ? 1 : 0; });

	//loop to adjust particles that are already drawn (I want this to work every time and on all nodes)
	if (params.drawPass > params.particleTypes.length){
		indices.forEach(function(index){

			var node = params.octreeNodes[p][index];
			var obj = params.scene.getObjectByName(p+node.id);

			if (obj){

				if (node.screenSize >= params.minNodeScreenSize && node.inView){
					//particles to adjust (I could make this an if statement t only change if needed, but would that even speed things up?)
					obj.material.uniforms.maxToRender.value = node.NparticlesToRender;
					obj.material.uniforms.pointScale.value = node.particleSizeScale;
					obj.material.needsUpdate = true;
					if (node.particles.length >= node.NparticlesToRender) node.particles = node.particles.slice(0, node.NparticlesToRender);
				} else {
					//particles to remove
					if (params.toRemove.length < params.maxToRemove && node.particles.length > params.minNParticlesToDraw && !params.toRemoveIDs.includes(p+node.id)){
						//console.log('removing node', p, node.id, node.NparticlesToRender, node.Nparticles, node.particles.length, node.screenSize, node.inView)
						params.toRemove.push([p, node.id]); //will be removed later
						params.toRemoveIDs.push(p+node.id);
					}

				}
			}
		})
	}

	//loop to add to the draw list, only when there are available slots in params.toDraw
	if (params.toDraw.length < params.maxFilesToRead) {

		indices.every(function(index){

			var node = params.octreeNodes[p][index];
			var obj = params.scene.getObjectByName(p+node.id);

			if (!params.toDrawIDs.includes(p+node.id)){
				//new nodes
				if (!obj && node.screenSize >= params.minNodeScreenSize && node.inView){
					//console.log('drawing node', p, node.id, node.NparticlesToRender, node.Nparticles, node.particles.length, node.screenSize, node.inView)
					params.toDraw.push([p, node.id, false]);
					params.toDrawIDs.push(p+node.id);
				}
				
				//existing node that needs more particles
				if (obj && node.particles.length < node.NparticlesToRender && params.toDraw.length < params.maxFilesToRead && node.inView){
					//console.log('updating node', p, node.id, node.NparticlesToRender, node.Nparticles, node.particles.length, node.screenSize, node.inView)
					params.toDraw.push([p, node.id, true]); //will be updated later
					params.toDrawIDs.push(p+node.id);
				} 
			}

			if (params.toDraw.length >= params.maxFilesToRead) {
				console.log('reached draw limit', p, params.toDraw.length);
				return false;
			}
			return true;
		})

	}

	//increment relevant variables
	params.drawPass += 1;
	params.pIndex = (params.pIndex + 1) % params.particleTypes.length;


	
}

function clearDrawer(){
	params.drawCount = 0;
	params.drawIndex = -1;
	params.toDraw = [];
	params.toDrawIDs = [];

}

function clearRemover(){
	params.removeCount = 0;
	params.removeIndex = -1;
	params.toRemove = [];
	params.toRemoveIDs = [];
}

function removeUnwantedNodes(){
	console.log('removing', params.toRemove.length);
	params.removeCount = 0;
	params.removeIndex = params.toRemove.length;
	params.toRemove.forEach(function(arr){
		var p = arr[0];
		var iden = arr[1];
		var obj = params.scene.getObjectByName(p+iden);
		var node = null;
		params.octreeNodes[p].forEach(function(n){
			if (n.id == iden) node = n;
		})
		if (node && obj){
			//swap geometry for the minimum number of particles to show
			var geo = createParticleGeometry(node.particles, 0, params.minNParticlesToDraw);
			obj.geometry = geo;
			obj.geometry.needsUpdate = true;
			node.particles = node.particles.slice(0, params.minNParticlesToDraw);
		}
		params.removeCount += 1;

	});
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
		if (node) drawNode(node, updateGeo);
	})
}


function setNodeDrawParams(node){
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

	if (width == 0) console.log('bad width', node.particleType, node.id, xwidth, ywidth, zwidth);

	//this will be a width in pixels
	node.screenSize = width

	//this will be a normalized width between 0 and 1 (by what should I normalize to)
	//node.screenSize = width/((window.innerWidth + window.innerHeight)/2.)

	//distance from camera
	node.cameraDistance = Math.max(0, params.camera.position.distanceTo( new THREE.Vector3( node.x, node.y, node.z) ));

	//check whether in view of the camera
	//var obj = params.scene.getObjectByName(node.particleType + node.id);
	//if (!obj) obj = params.nodeBoxes['Box' + node.particleType + node.id]; //in case the object hasn't been drawn yet, use the node box
	// var box = params.nodeBoxes['Box' + node.particleType + node.id]; 
	// if (box) node.inView = params.frustum.intersectsBox(box);
	node.inView = inFrustum(node);

	//number of particles to render will depend on the camera distance and fps
	//node.NparticlesToRender = Math.max(1., Math.min(node.Nparticles, Math.floor(node.Nparticles*params.boxSize/2./node.cameraDistance*params.NParticleFPSModifier)));
	node.NparticlesToRender = Math.max(params.minNParticlesToDraw, Math.min(node.Nparticles, Math.floor(node.Nparticles*node.screenSize/window.innerWidth*params.NParticleFPSModifier)));

	if (node.screenSize < params.minNodeScreenSize || !node.inView) node.NparticlesToRender = params.minNParticlesToDraw;

	node.NparticlesToRender = Math.min(node.Nparticles, node.NparticlesToRender);

	//scale particles size by the fraction rendered?
	node.particleSizeScale = params.boxSize*node.Nparticles/node.NparticlesToRender*params.particleDefaultSizeScale[node.particleType];
	//node.particleSizeScale = node.cameraDistance*node.Nparticles/node.NparticlesToRender*params.particleDefaultSizeScale[node.particleType];
	//node.particleSizeScale = params.boxSize/node.screenSize*node.Nparticles/node.NparticlesToRender*params.particleDefaultSizeScale[node.particleType];
	//node.particleSizeScale = node.cameraDistance*params.particleDefaultSizeScale[node.particleType];
	//node.particleSizeScale = (window.innerWidth/node.screenSize)*(node.Nparticles/node.NparticlesToRender)*params.particleDefaultSizeScale[node.particleType];



}

function inFrustum(node){
	//check if any of the corners is within the frustum
	var p;

	p = new THREE.Vector3( node.x + node.width/2., node.y + node.width/2., node.z + node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x - node.width/2., node.y + node.width/2., node.z + node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x + node.width/2., node.y - node.width/2., node.z + node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x - node.width/2., node.y - node.width/2., node.z + node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x + node.width/2., node.y + node.width/2., node.z - node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x - node.width/2., node.y + node.width/2., node.z - node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x + node.width/2., node.y - node.width/2., node.z - node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	p = new THREE.Vector3( node.x - node.width/2., node.y - node.width/2., node.z - node.width/2.);
	if (params.frustum.containsPoint(p)) return true;

	return false;

}
