function clearScene(){

	//clear everything first
	while (params.scene.children.length > 0){ 
		params.scene.remove(params.scene.children[0]); 
	}

}

function addParticlesToScene(parts, color, name, start, end, minPointScale=3.){

	var blend = THREE.AdditiveBlending;
	var dWrite = false;
	var dTest = false;
	var transp = true;

	var material = new THREE.ShaderMaterial( {

		uniforms: { //add uniform variable here
			color: {value: new THREE.Vector4( color[0], color[1], color[2], color[3])},
			minPointScale: {value: minPointScale},
		},

		vertexShader: myVertexShader,
		fragmentShader: myFragmentShader,
		depthWrite:dWrite,
		depthTest: dTest,
		transparent:transp,
		alphaTest: false,
		blending:blend,
	} );

	//geometry
	var geo = new THREE.BufferGeometry();

	//if all == true, then we draw all the particles except the first, which will always be there to define the node locations
	//otherwise, we only draw the first particle	
	if (!start) start = 0;
	if (!end) end = parts.length;
	var len = end - start;
	var i0 = start;
	var id = name;

	// attributes
	//positions
	var positions = new Float32Array( len*3 ); // 3 vertices per point
	geo.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	geo.setDrawRange( 0, len );

	var mesh = new THREE.Points(geo, material);
	mesh.name = name;
	params.scene.add(mesh);

	var pindex = i0;
	for (var j=0; j<len; j++){
			
			positions[pindex++] = parseFloat(parts[j].x);
			positions[pindex++] = parseFloat(parts[j].y);
			positions[pindex++] = parseFloat(parts[j].z);
	}

	mesh.position.set(0,0,0);
	params.drawing = false;
	
}


function drawNode(id, color, name, start, end, minPointScale=3){
	params.drawing = true;

	//read in the file, and then draw the particles
	d3.csv('src/data/octreeNodes/' + id + '.csv')
	.then(function(d) {
		// console.log('parts',id, d)
		// checkExtent(d)
		addParticlesToScene(d, color, name, start, end, minPointScale);
	})
	.catch(function(error){
		console.log('ERROR:', error)
	})
}


function drawOctreeBox(node, color){
	// console.log('box', node.x, node.y, node.z, node.width)
	const geometry = new THREE.BoxGeometry( node.width, node.width, node.width);

	var geo = new THREE.EdgesGeometry( geometry ); // or WireframeGeometry( geometry )
	var mat = new THREE.LineBasicMaterial( { color: color, linewidth: 2 } );
	var wireframe = new THREE.LineSegments( geo, mat );
	wireframe.position.set(node.x, node.y, node.z);

	params.scene.add(wireframe);
}
function drawOctreeBoxes(color='#FF0000'){
	params.octreeNodes.forEach(function(node){
		drawOctreeBox(node, color);

	})

}

function checkExtent(parts){
	var maxX = -1e10;
	var maxY = -1e10; 
	var maxZ = -1e10; 
	var minX = 1e10;
	var minY = 1e10;
	var minZ = 1e10;
	parts.forEach(function(p){
		maxX = Math.max(maxX, parseFloat(p.x))
		maxY = Math.max(maxY, parseFloat(p.y))
		maxZ = Math.max(maxZ, parseFloat(p.z))
		minX = Math.min(minX, parseFloat(p.x))
		minY = Math.min(minY, parseFloat(p.y))
		minZ = Math.min(minZ, parseFloat(p.z))
	})
	console.log('extentX', minX, maxX, maxX - minX, (maxX + minX)/2.);
	console.log('extentY', minY, maxY, maxY - minY, (maxX + minX)/2.);
	console.log('extentZ', minZ, maxZ, maxZ - minZ, (maxX + minX)/2.);
}
