

//this initializes everything needed for the scene
function init(){

	var screenWidth = window.innerWidth;
	var screenHeight = window.innerHeight;
	var aspect = screenWidth / screenHeight;

	// renderer
	params.renderer = new THREE.WebGLRenderer( {
		antialias:true,
	} );
	params.renderer.setSize(screenWidth, screenHeight);

	params.container = document.getElementById('WebGLContainer');
	params.container.appendChild( params.renderer.domElement );

	// scene
	params.scene = new THREE.Scene();     

	// camera
	params.camera = new THREE.PerspectiveCamera( params.fov, aspect, params.zmin, params.zmax);
	params.camera.up.set(0, -1, 0);
	params.camera.position.z = 10000;
	params.scene.add(params.camera);  

	//will hold the camera frustum (updated in renderAll)
	params.frustum = new THREE.Frustum();

	// events
	THREEx.WindowResize(params.renderer, params.camera);

	//controls
	params.controls = new THREE.TrackballControls( params.camera, params.renderer.domElement );
	// params.controls = new THREE.FlyControls( params.camera , params.renderer.domElement);
	// params.controls.movementSpeed = 50.;



}

function pruneOctree(tree){
	out = [];
	tree.forEach(function(d){
		d.showing = false; //will be set to true if it is fully rendered
		if (d.Nparticles > 0) out.push(d)
	})

	return out
}

//this is called to start everything
function WebGLStart(d){

//remove any nodes that don't have particles (leaving only the base leafs)
	pruned = pruneOctree(d);

//define params and add the data
	defineParams(pruned);

//initialize everything
	init();

//draw the octree node centers
//	addParticlesToScene(params.octreeNodes, [1, 0, 0, 1], 'centers', null, null, 10);

//check
	// var index = 1
	// console.log(params.octreeNodes[index])
	// drawNode(params.octreeNodes[index].id, [ 0,  1,  0, 1], 'foo', null, null, 10.);
	// drawOctreeBox(params.octreeNodes[index], '#FF0000')

//draw the octree boxes
	drawOctreeBoxes();

//draw the first particles in each node (these will stay regardless of camera distance)
	params.octreeNodes.forEach(function(node){
		//just the first particles (these will stay regardless of camera distance)
		drawNode(node.id, [ 1,  0,  0, 1], node.id+'First', 0, 1, 10.)
		//all the particles (as a test)
		//if (node.Nparticles > 0) drawNode(node.id, [ 0, 1, 0, 1], node.id, null, null, 10)
	})

//begin the animation
	animate();
}

//runs on load
d3.json('src/data/octreeNodes/octree.json')
	.then(function(d) {
		console.log(d);
		WebGLStart(d);
	})
	.catch(function(error){
		console.log('ERROR:', error)
	})