function createUI(){

	params.gui = new dat.GUI();
	params.particleTypes.forEach(function(p){
		params.gui.add( params.particleDefaultSizeScale, p, 0,2).name(p+' size').onChange(function(){GUIUpdateParticles(p);});
		params.gui.add( params.particleAlphaGUI, p, 0,1).name(p+' alpha').onChange(function(){GUIUpdateParticles(p);});
		params.gui.addColor( params.particleColors, p).name(p+' color').onChange(function(){GUIUpdateParticles(p);});
	}) 

}

function GUIUpdateParticles(p){
	params.particleColors[p][3] = params.particleAlphaGUI[p]
	params.octreeNodes[p].forEach(function(node,i){
		node.particleSizeScale = params.boxSize*node.Nparticles/node.NparticlesToRender*params.particleDefaultSizeScale[p];
		var obj = params.scene.getObjectByName(p+node.id);
		if (obj){
			obj.material.uniforms.pointScale.value = node.particleSizeScale;
			var color = params.particleColors[p];
			obj.material.uniforms.color.value = new THREE.Vector4( color[0]/255., color[1]/255., color[2]/255., color[3]);
			obj.material.needsUpdate = true;
		}
	});


}