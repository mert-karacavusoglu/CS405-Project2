/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.specularLoc = gl.getUniformLocation(this.prog, 'specularCoefficient');
	
		this.normalbuffer = gl.createBuffer();

		this.ambientLight = 0.1; //This variable is to keep track of the value of the ambient light slider
		this.specularLight = 50.0; //This variable is to keep track of the value of the specular light slider

		this.textureOne;
		this.textureTwo;
	}							  

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
		
		// update normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);	
		
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);	
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

		updateLightPos();

		let lightColor = [1, 1, 1];
		let lightPos = [lightX, lightY, -1];

		gl.useProgram(this.prog);
		gl.uniform3fv(this.colorLoc, lightColor);

		gl.useProgram(this.prog);
		gl.uniform3fv(this.lightPosLoc, lightPos);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, num = 0) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB, 
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {		
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		let str;
		gl.useProgram(this.prog);
		if (num == 0) {
			str = 'tex0'
			gl.uniform1i(gl.getUniformLocation(this.prog, 'firstTexture'), 1);
		}

		else if (num == 1) {
			str = 'tex1'
			gl.uniform1i(gl.getUniformLocation(this.prog, 'secondTexture'), 1);
		}
		
		gl.activeTexture(gl.TEXTURE0 + num);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler0 = gl.getUniformLocation(this.prog, str);
		gl.uniform1i(sampler0, num);

		
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableLightingLoc, show)
		gl.uniform1f(this.ambientLoc, this.ambientLight); //Set ambient lighting as the value from the slider
		gl.uniform1f(this.specularLoc, this.specularLight);
	}										
	setAmbientLight(ambient) {
		this.ambientLight = ambient*0.2;
		gl.useProgram(this.prog);
		gl.uniform1f(this.ambientLoc, this.ambientLight);
		
	}
	setSpecularLight(specular) {
		this.specularLight = specular;
		gl.useProgram(this.prog); 
		gl.uniform1f(this.specularLoc, this.specularLight);
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 
			varying vec4 v_position;

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;
				v_position = mvp * vec4(pos, 1);

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform bool firstTexture;
			uniform bool secondTexture;
			uniform sampler2D tex0;
			uniform sampler2D tex1;
			uniform vec3 color; 
			uniform vec3 lightPos;
			uniform float ambient;
			uniform float specularCoefficient;

			varying vec2 v_texCoord;
			varying vec3 v_normal;
			varying vec4 v_position;

			void main()
			{

				if(showTex && enableLighting){

					vec4 textureColor;

					if (firstTexture && secondTexture) {
						vec4 texture1Color = texture2D(tex0, v_texCoord); //Get Texture Color
						vec4 texture2Color = texture2D(tex1, v_texCoord); //Get Texture Color
						textureColor = mix(texture1Color, texture2Color, 0.5);
					}

					else if (firstTexture && !secondTexture) {
						textureColor = texture2D(tex0, v_texCoord);
					}

					else if (secondTexture && !firstTexture) {
						textureColor = texture2D(tex1, v_texCoord);
					}
					
					
					//Handle Diffuse Lighting
					vec3 normalizedNormal = normalize(v_normal);
					vec3 lightPosition = normalize(lightPos);

					float diffuseLight = max(dot(normalizedNormal,lightPosition), 0.0); //If dot product is negative set as 0
					vec3 diffuseL = color * diffuseLight;
					
					//Handle Spectral Lighting

					vec3 viewPosition;
					viewPosition.x = 0.0;
					viewPosition.y = 0.0;
					viewPosition.z = -1.0;

					vec3 viewDirection = normalize(viewPosition);

					float normalDot = dot(normalizedNormal, lightPosition);
					float specular = 0.0;

					if (normalDot > 0.0) {
						vec3 reflectDirection = reflect(-lightPosition, normalizedNormal);
						specular = pow(max(dot(viewDirection, reflectDirection), 0.0), specularCoefficient);
					}	

					vec3 specularL = color * specular;

					//Handle Ambient Lighting
					vec3 ambientL;
					ambientL.r = ambient;
					ambientL.g = ambient;
					ambientL.b = ambient;
					
					vec3 finalColor = (ambientL + diffuseL + specularL) * textureColor.rgb; //Combine Colors to determine final color to "paint"
					gl_FragColor = vec4(finalColor, textureColor.a);
				}
				else if(showTex){
					vec4 textureColor;

					if (firstTexture && secondTexture) {
						vec4 texture1Color = texture2D(tex0, v_texCoord); //Get Texture Color
						vec4 texture2Color = texture2D(tex1, v_texCoord); //Get Texture Color
						textureColor = mix(texture1Color, texture2Color, 0.5);
					}

					else if (firstTexture && !secondTexture) {
						textureColor = texture2D(tex0, v_texCoord);
					}

					else if (secondTexture && !firstTexture) {
						textureColor = texture2D(tex1, v_texCoord);
					}

					gl_FragColor = textureColor;
				}
				else{
					gl_FragColor =  vec4(1.0, 0, 0, 1.0);
				}
			}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////