//this is the animation loop
function animate(time) {
	requestAnimationFrame( animate );
	update();
	render();
}

function update(){
	params.controls.update();

	//check if any of the nodes are close enough to draw (or could do this based on fps?)
	params.octreeNodes.forEach(function(node){
		node.cameraDistance = params.camera.position.distanceTo( new THREE.Vector3( node.x, node.y, node.z) );
		if (node.cameraDistance <= params.minCamDist && !node.showing){
			console.log('drawing node', node.id)
			//draw the particles in the node
			node.showing = true;
			drawNode(node.id, [ Math.random(),  Math.random(),  Math.random(), 1], node.id, 1, node.Nparticles)
		}
		if (node.cameraDistance > params.minCamDist && node.showing){
			console.log('removing node', node.id)
			//remove the particles in the node (though this will still keep the initial particle to mark the node location)
			node.showing = false;
			var obj = params.scene.getObjectByName(node.id);
			params.scene.remove(obj);
		}
	})
}

function render(){
	params.renderer.render( params.scene, params.camera );
}