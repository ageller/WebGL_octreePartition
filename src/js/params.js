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

		//minimum pixel width for a node to require rendering all the points 
		this.minNodeScreenSize = 10;

		//default minimum particles size
		this.defaultMinParticlesSize = 2.;

		//will contain a list of nodes that are drawn
		this.fullyDrawn = [];
		this.drawing = false;

		this.maxParticlesToDraw = 5e6;
		this.totalParticlesDrawn = 0;
	};


}
