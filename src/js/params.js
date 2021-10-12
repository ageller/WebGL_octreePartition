//all "global" variables are contained within params object
var params;
function defineParams(octree=null){
	params = new function() {
		//to hold the data
		this.octreeNodes = octree;
		
		this.container = null;
		this.renderer = null;
		this.scene = null;
		this.camera = null;
		this.frustum = null;

		//for frustum      
		this.zmax = 5.e10;
		this.zmin = 1;
		this.fov = 60.

		//minimum size that a node must be to render the points (fraction of screen)
		this.minNodeScreenSize = 0.05;

		//will contain a list of nodes that are drawn
		this.fullyDrawn = [];
		this.drawing = false;

		this.maxParticlesToDraw = 1e6;
		this.totalParticlesDrawn = 0;
	};


}
