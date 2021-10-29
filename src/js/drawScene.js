function clearScene(){

	//clear everything first
	while (params.scene.children.length > 0){ 
		params.scene.remove(params.scene.children[0]); 
	}

}


function createParticleGeometry(parts, start, end){
	//geometry
	var geo = new THREE.BufferGeometry();

	//if all == true, then we draw all the particles except the first, which will always be there to define the node locations
	//otherwise, we only draw the first particle	
	if (!start) start = 0;
	if (!end) end = parts.length;
	end = Math.min(parts.length, end);
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

	var pindex = 0;
	for (var j=0; j<len; j++){
			
			position[pindex++] = parseFloat(parts[j].x);
			position[pindex++] = parseFloat(parts[j].y);
			position[pindex++] = parseFloat(parts[j].z);

			pointIndex[j] = parseFloat(j);

	}

	return geo;
}

function addParticlesToScene(parts, color, name, start, end, minPointSize=params.defaultMinParticleSize, pointScale=1., updateGeo=false){
	//I can use the start and end values to define how many particles to add to the mesh,
	//  but first I want to try limitting this in the shader with maxToRender.  That may be quicker than add/removing meshes.

	params.drawStartTime = new Date().getTime()/1000;

	//geometry
	var geo = createParticleGeometry(parts, start, end);

	var maxN = end - start;

	if (updateGeo){
		//update the geometry in the mesh
		var obj = params.scene.getObjectByName(name);
		if (obj){
			obj.geometry = geo;
			obj.geometry.needsUpdate = true;
		}

	} else {
		//create the mesh
		var blend = THREE.AdditiveBlending;
		var dWrite = false;
		var dTest = false;
		var transp = true;

		var material = new THREE.ShaderMaterial( {

			uniforms: { //add uniform variable here
				color: {value: new THREE.Vector4( color[0]/255., color[1]/255., color[2]/255., color[3])},
				minPointSize: {value: minPointSize},
				pointScale: {value: pointScale},
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



		var mesh = new THREE.Points(geo, material);
		mesh.name = name;
		params.scene.add(mesh);

		mesh.position.set(0,0,0);
	}

	//remove from the toDraw list
	const index = params.toDrawIDs.indexOf(name);
	// if (index > -1) {
	// 	params.toDraw.splice(index, 1);
	// 	params.toDrawIDs.splice(index, 1);
	// }
	params.drawCount += 1;

	//console.log('checking drawing', params.drawCount, params.drawIndex, params.toDraw.length)

}


function drawNode(node, updateGeo=false){

	var drawn = false;
	var start = 0;
	var end = node.NparticlesToRender;
	var minSize = params.defaultMinParticleSize;
	var sizeScale = node.particleSizeScale;
	var color = params.particleColors[node.particleType];
	var name = node.particleType + node.id;

	if (node.hasOwnProperty('particles')){
		if (node.particles.length >= node.NparticlesToRender){
			drawn = true;
			addParticlesToScene(node.particles, color, name, start, end, minSize, sizeScale, updateGeo);
		}
	}

	if (!drawn){
		//read in the file, and then draw the particles
		d3.csv(params.fileRoot[node.particleType] + '/' + node.id + '.csv').then(function(d) {
				// console.log('parts',id, d)
				// checkExtent(d)
				node.particles = d.slice(0,node.NparticlesToRender);
				addParticlesToScene(d, color, name, start, end, minSize, sizeScale, updateGeo);
			})
			.catch(function(error){
				console.log('ERROR:', error)
			})
	}

}


function drawOctreeBox(node, color, linewidth, alpha){
	// console.log('box', node.x, node.y, node.z, node.width)
	const geometry = new THREE.BoxGeometry( node.width, node.width, node.width);

	var geo = new THREE.EdgesGeometry( geometry ); // or WireframeGeometry( geometry )
	var mat = new THREE.LineBasicMaterial( { 
		color: color, 
		linewidth: linewidth,
		opacity: alpha,
	} );
	var wireframe = new THREE.LineSegments( geo, mat );
	wireframe.position.set(node.x, node.y, node.z);
	wireframe.name = 'Box'+node.particleType + node.id;

	params.scene.add(wireframe);
}
function drawOctreeBoxes(octreeNodes, color='#00FFFF', linewidth=2, alpha=1){
	octreeNodes.forEach(function(node){
		drawOctreeBox(node, color, linewidth, alpha);

	})
}


function createOctreeBox(node){
	var min = new THREE.Vector3(node.x - node.width/2, node.y - node.width/2, node.z - node.with/2);
	var max = new THREE.Vector3(node.x + node.width/2, node.y + node.width/2, node.z + node.with/2);
	const box = new THREE.Box3(min, max);
	params.nodeBoxes['Box'+node.particleType + node.id] = box;
}
function createOctreeBoxes(octreeNodes){
	octreeNodes.forEach(function(node){
		createOctreeBox(node);
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
