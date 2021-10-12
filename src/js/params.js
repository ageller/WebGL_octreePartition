//all "global" variables are contained within params object
var params;
function defineParams(octree=null){
	params = new function() {
		//to hold the data
		this.octreeNodes = octree;
		
		this.container = null;
		this.renderer = null;
		this.scene = null;

		//for frustum      
		this.zmax = 5.e10;
		this.zmin = 1;
		this.fov = 60.

		//camera distance under which we draw all the particles
		this.minCamDist = 100;

	};


}
