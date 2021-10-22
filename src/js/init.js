


//this initializes everything needed for the scene
function init(target){

	var screenWidth = window.innerWidth;
	var screenHeight = window.innerHeight;
	var aspect = screenWidth / screenHeight;

	//add the stats indicator
	params.stats = []
	for (var i=0; i<3; i++){
	 	var stats = new Stats();
 		stats.showPanel( i ); // 0: fps, 1: ms, 2: mb, 3+: custom
 		stats.domElement.style.cssText = 'position:absolute;top:0px;left:' + (i*80) + 'px;';
		document.body.appendChild( stats.dom );
		params.stats.push(stats);
	}


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
	//set the target position from the initial node center
	if (target) params.controls.target = target;
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
	params.particleTypes.forEach(function(p,i){
		params.octreeNodes[p] = pruneOctree(d[i]);
		//draw the octree node centers
		// addParticlesToScene(params.octreeNodes[p], params.particleColors[p], 'centers', null, null, 10);
	})
	//params.octreeNodes = d;

//initialize everything
//get the center for controls
	var target;
	d[0].forEach(function(node, i){
		if (node.id == 0) target = new THREE.Vector3(node.x, node.y, node.z);
	})
	init(target);


//draw the octree boxes for the first particle group
	// drawOctreeBoxes(d[0]);


//begin the animation
	animate();
}

//runs on load
defineParams();
var promises = [];
params.particleTypes.forEach(function(p){
	promises.push(d3.json(params.fileRoot[p]+'/octree.json'))
})
Promise.all(promises).then(function(d) {
		console.log(d);
		WebGLStart(d);
	})
	.catch(function(error){
		console.log('ERROR:', error)
	})