var myVertexShader = `

const float minPointScale = 3.;
const float maxPointScale = 1000.;

void main(void) {

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	float cameraDist = length(mvPosition.xyz);
	float pointScale = 1./cameraDist;
	pointScale = clamp(pointScale, minPointScale, maxPointScale);
	
	gl_PointSize = pointScale;

	gl_Position = projectionMatrix * mvPosition;


}

`;
