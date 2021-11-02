//all "global" variables are contained within params object
var params;
function defineParams(){
	params = new function() {
		//to hold the data
		this.octreeNodes = {};
		
		//available particle type
		//this.particleTypes = ['Gas','Stars', 'LRDM','HRDM'];
		this.particleTypes = ['Gas','Stars', 'LRDM', 'HRDM'];
		this.particleColors = {'Gas':[ 255, 0, 200, 0.01],
							   'Stars':[0, 200, 255, 0.1],
							   'LRDM':[240, 240, 140, 0.05],
							   'HRDM':[240, 240, 140, 0.1]};
		this.fileRoot = {'Gas':'src/data/m12i_res71000-100k/octreeNodes/Gas',
						 'Stars':'src/data/m12i_res71000-100k/octreeNodes/Stars',
						 'LRDM':'src/data/m12i_res71000-100k/octreeNodes/LRDM',
						 'HRDM':'src/data/m12i_res71000-100k/octreeNodes/HRDM'};
		this.particleDefaultSizeScale = {'Gas':0.1, 'Stars':0.1, 'LRDM':0.1, 'HRDM':0.01};

		//for now I will add a new slider for alpha (since it is not handles well with dat.gui)
		this.particleAlphaGUI = {'Gas':this.particleColors.Gas[3],
							   'Stars':this.particleColors.Stars[3],
							   'LRDM':this.particleColors.LRDM[3],
							   'HRDM':this.particleColors.HRDM[3]};

		//normalization for the camera distance in deciding how many particles to draw
		this.normCameraDistance = {'Gas':1000,
						   		   'Stars':1000,
						   		   'LRDM':1000,
							       'HRDM':1000};;
		// this.particleTypes = ['Gaia'];
		// this.particleColors = {'Gaia':[1,1,1,0.5]};
		// this.fileRoot = {'Gaia':'src/data/Gaia/octreeNodes'};

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
		this.minNodeScreenSize = 1;



		//default minimum particles size
		//this.defaultMinParticleSize = 6.;
		this.defaultMinParticleSize = 1.;

		//will contain a list of nodes that are drawn
		this.alreadyDrawn = [];
		this.toRemove = [];
		this.toRemoveIDs = [];
		this.removeCount = 0;
		this.removeIndex = -1;
		this.toDraw = [];
		this.toDrawIDs = [];
		this.drawCount = 0;
		this.drawIndex = -1;
		this.drawPass = 1;
		this.drawStartTime = 0;
		this.maxDrawInterval = 10; //seconds
		this.maxFilesToRead = 50;
		this.maxToRemove = 50;

		this.minFracParticlesToDraw = 0.01; //minimum fraction per node to draw (unless there are less particles than this total in the node) >0

		this.FPS = 30; //will be changed each render call
		this.targetFPS = 30; //will be used to controls the NParticleFPSModifier
		this.NParticleFPSModifier = 1.; //will be increased or decreased based on the current fps
		//this.FPSmod = 100;// reset the FPS average every FPSmod draw counts
		this.FPSmod = 1e10;// reset the FPS average every FPSmod draw counts (not sure this is needed anymore, but not ready to remove from code)
		this.boxSize; //will be set based on the root node
		this.pIndex = 0; //will be used to increment through the particles in the render loop

		this.nodeBoxes = {};
	};


}
