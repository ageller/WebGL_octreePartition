function createUI(){

	params.gui = new dat.GUI();
	params.particleTypes.forEach(function(p){
		params.gui.add( params.normCameraDistance, p, 1, params.boxSize/10).name(p+' camNorm');//.onChange(function(){GUIUpdateParticles(p);});
		params.gui.add( params.particleDefaultSizeScale, p, 0,2).name(p+' size').onChange(function(){GUIUpdateParticles(p);});
		params.gui.add( params.particleAlphaGUI, p, 0,1).name(p+' alpha').onChange(function(){GUIUpdateParticles(p);});
		params.gui.addColor( params.particleColors, p).name(p+' color').onChange(function(){GUIUpdateParticles(p);});
	}) 

}

function GUIUpdateParticles(p){
	params.particleColors[p][3] = params.particleAlphaGUI[p]
	params.octreeNodes[p].forEach(function(node,i){
		node.particleSizeScale = params.boxSize*node.Nparticles/node.NparticlesToRender*params.particleDefaultSizeScale[p];
		node.color = params.particleColors[p]
		node.color[3] *= Math.min(1., node.Nparticles/node.NparticlesToRender);
		var obj = params.scene.getObjectByName(p+node.id);
		if (obj){
			obj.material.uniforms.pointScale.value = node.particleSizeScale;
			obj.material.uniforms.color.value = new THREE.Vector4( node.color[0]/255., node.color[1]/255., node.color[2]/255., node.color[3]);
			obj.material.needsUpdate = true;
		}
	});


}