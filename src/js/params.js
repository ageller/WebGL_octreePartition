//all "global" variables are contained within params object
var params;
function defineParams(){
	params = new function() {
		//to hold the data
		this.octreeNodes = {};
		
		//available particle type
		this.particleTypes = ['Gas','Stars']
		this.particleColors = {'Gas':[ 1, 0, 0, 1],
							   'Stars':[0, 0, 1, 1]};
		this.fileRoot = {'Gas':'src/data/m12i_res71000/octreeNodes/Gas',
						 'Stars':'src/data/m12i_res71000/octreeNodes/Stars'};

		//this.particlesTypes = ['Gaia'];
		//this.particleColors = {Gaia:[1,1,1,1]};
		//this.fileRoot = 'src/data/Gaia/octreeNodes';

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
		this.defaultMinParticleSize = 4.;

		//will contain a list of nodes that are drawn
		this.alreadyDrawn = [];
		this.drawing = false;
		this.removing = false;
		this.toRemove = [];
		this.toDraw = [];

		this.FPS = 30; //will be changed each render call
		this.minFPS = 10; //below this we stop drawing particles
		this.targetFPS = 27; //above this we will add particles (note: I think the max fps possible will depend on your monitor)
		this.NParticleFPSModifier = 1.; //will be increased or decreased based on the current fps
	};


}
