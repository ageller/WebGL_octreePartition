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
		this.stats = null;

		//for frustum      
		this.zmax = 5.e10;
		this.zmin = 1;
		this.fov = 60.

		//minimum pixel width for a node to require rendering points
		this.minNodeScreenSize = 10;

		//default minimum particles size
		this.defaultMinParticlesSize = 1.;

		//will contain a list of nodes that are drawn
		this.fullyDrawn = [];
		this.drawing = false;

		this.minFPS = 20; //below this we stop drawing particles
		this.targetFPS = 27; //above this we will add particles (note: I think the max fps possible will depend on your monitor)
		this.NParticleFPSModifier = 1.; //will be increased or decreased based on the current fps
		this.totalParticlesDrawn = 0;
	};


}
