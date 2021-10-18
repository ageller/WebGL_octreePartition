var myVertexShader = `

attribute float pointIndex;

uniform float minPointScale;

varying float vIndex;

const float maxPointScale = 100.;

void main(void) {

	vIndex = pointIndex;

	vec4 mvPosition = modelViewMatrix*vec4( position, 1.0 );

	float cameraDist = length(mvPosition.xyz);
	float pointScale = 1./cameraDist;
	pointScale = clamp(pointScale, minPointScale, maxPointScale);
	
	gl_PointSize = pointScale;

	gl_Position = projectionMatrix*mvPosition;


}

`;
