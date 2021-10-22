function clearScene(){

	//clear everything first
	while (params.scene.children.length > 0){ 
		params.scene.remove(params.scene.children[0]); 
	}

}

function addParticlesToScene(parts, color, name, start, end, minPointScale=params.defaultMinParticleSize, maxN=params.maxParticlesToDraw){
	//I can use the start and end values to define how many particles to add to the mesh,
	//  but first I want to try limitting this in the shader with maxToRender.  That may be quicker than add/removing meshes.

	var blend = THREE.AdditiveBlending;
	var dWrite = false;
	var dTest = false;
	var transp = true;

	var material = new THREE.ShaderMaterial( {

		uniforms: { //add uniform variable here
			color: {value: new THREE.Vector4( color[0], color[1], color[2], color[3])},
			minPointScale: {value: minPointScale},
			maxToRender: {value: maxN} //this will be modified in the render loop
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
	//position
	var position = new Float32Array( len*3 ); // 3 vertices per point
	geo.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ) );

	//index
	var pointIndex = new Float32Array( len );
	geo.addAttribute( 'pointIndex', new THREE.BufferAttribute( pointIndex, 1 ) );

	geo.setDrawRange( 0, len );

	var mesh = new THREE.Points(geo, material);
	mesh.name = name;
	params.scene.add(mesh);

	var pindex = 0;
	for (var j=0; j<len; j++){
			
			position[pindex++] = parseFloat(parts[j].x);
			position[pindex++] = parseFloat(parts[j].y);
			position[pindex++] = parseFloat(parts[j].z);

			pointIndex[j] = parseFloat(j);

	}

	mesh.position.set(0,0,0);

}


function drawNode(p, node){

	var drawn = false;
	if (node.hasOwnProperty('particles')){
		if (node.particles.length >= node.NparticlesToRender){
			drawn = true;
			addParticlesToScene(node.particles, params.particleColors[p], p+node.id, 0, node.NparticlesToRender, params.defaultMinParticleSize, node.NparticlesToRender);
		}
	}

	if (!drawn){
		//read in the file, and then draw the particles
		d3.csv(params.fileRoot[p] + '/' + node.id + '.csv')
			.then(function(d) {
				// console.log('parts',id, d)
				// checkExtent(d)
				node.particles = d.slice(0,node.NparticlesToRender);
				addParticlesToScene(d, params.particleColors[p], p+node.id, 0, node.NparticlesToRender, params.defaultMinParticleSize, node.NparticlesToRender);
			})
			.catch(function(error){
				console.log('ERROR:', error)
			})
	}

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
function drawOctreeBoxes(octreeNodes, color='#00FFFF'){
	octreeNodes.forEach(function(node){
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
