function clearScene(){

	//clear everything first
	while (params.scene.children.length > 0){ 
		params.scene.remove(params.scene.children[0]); 
	}

}

function addParticlesToScene(parts, color, name, start, end){

	var blend = THREE.AdditiveBlending;
	var dWrite = false;
	var dTest = false;
	var transp = true;


	var material = new THREE.ShaderMaterial( {

		uniforms: { //add uniform variable here
			color: {value: new THREE.Vector4( color[0], color[1], color[2], color[3])},
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
			
			positions[pindex++] = parts[j].x;
			positions[pindex++] = parts[j].y;
			positions[pindex++] = parts[j].z;
	}

	mesh.position.set(0,0,0);
	
}


function drawNode(id, color, name, start, end){

	//read in the file, and then draw the particles
	d3.csv('src/data/octreeNodes/' + id + '.csv')
	.then(function(d) {
		addParticlesToScene(d, color, name, start, end);
	})
	.catch(function(error){
		console.log('ERROR:', error)
	})
}



