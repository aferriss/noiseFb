var w = window.innerWidth;
var h = window.innerHeight;

var scene, renderer, camera, plane, tex;
var blurHScene, blurVScene, noiseRTT, blurHRtt, blurVRtt;
var blurHShader, blurVShader;
var sizeX = w;
var sizeY = h;

init();

function init(){

	scene = new THREE.Scene();
	blurHScene = new THREE.Scene();
	blurVScene = new THREE.Scene();

	camera = new THREE.OrthographicCamera( w/-2, w/2, h/2, h/-2, -10000, 10000);

	scene.add(camera);
	blurHScene.add(camera);
	blurVScene.add(camera);

	noiseRTT = new THREE.WebGLRenderTarget(w, h, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
	blurHRtt = new THREE.WebGLRenderTarget(w, h, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
	blurVRtt = new THREE.WebGLRenderTarget(w, h, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });

	blurHShader = new THREE.ShaderMaterial({
		uniforms:{
			u_image: { type:'t', value: noiseRTT },
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0/sizeX, 1.0/sizeY) }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('blurH').textContent
	});

	blurVShader = new THREE.ShaderMaterial({
		uniforms:{
			u_image: { type:'t', value: blurHRtt },
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0/sizeX, 1.0/sizeY) }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('blurV').textContent
	});

	var noisepixels = [];
	var pixels = [];
	for ( var i = 0; i < sizeX; i++) {
		for ( var j = 0; j < sizeY; j++) {
			noisepixels.push(Math.random() * 255, Math.random() * 255, Math.random() * 255, 255);
			pixels.push(0, 0, 0, 255);
		}
	}

	var pixelData = new Uint8Array(noisepixels);
	tex = new THREE.DataTexture( pixelData, sizeX, sizeY, THREE.RGBAFormat);
	tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
	tex.minFilter = THREE.LinearFilter;
	tex.needsUpdate = true;

	var planeGeo = new THREE.PlaneBufferGeometry(sizeX, sizeY);
	var planeMat = new THREE.MeshBasicMaterial({map: tex});
	
	plane = new THREE.Mesh(planeGeo, planeMat);
	scene.add(plane);

	plane = new THREE.Mesh(planeGeo, blurHShader);
	blurHScene.add(plane);

	plane = new THREE.Mesh(planeGeo, blurVShader);
	blurVScene.add(plane);

	renderer = new THREE.WebGLRenderer({ antialias:true});

  	renderer.setSize(w, h);

  	container.appendChild(renderer.domElement);

  	render();

}


function render(){

	renderer.render(scene, camera, noiseRTT, true);
	renderer.render(blurHScene, camera, blurHRtt, true);
	renderer.render(blurVScene, camera, blurVRtt, true);

	renderer.render(blurVScene, camera);

	
	//blurHShader.needsUpdate = true;
	//blurVShader.needsUpdate = true;

	blurHShader.uniforms.u_image.value = blurVRtt;

	window.requestAnimationFrame(render);
}





