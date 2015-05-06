var w = window.innerWidth;
var h = window.innerHeight;

var scene, renderer, camera, plane, tex;
var blurHScene, blurVScene, advanceScene, diffScene;
var noiseRTT, blurHRtt, blurVRtt, advanceRtt, prev;
var blurHShader, blurVShader, advanceShader, diffShader, baseShader;
var sizeX = 2048;
var sizeY = 2048;
var time = 0;
var container = document.getElementById('container');
var mouseX = 0.5;
var mouseY = 0.5;
var it = 1;
init();

document.onmousemove = function(evt) {
		mouseX = evt.offsetX / w;
		mouseY = 1 - evt.offsetY / h;
};

function init(){

	scene = new THREE.Scene();
	blurHScene = new THREE.Scene();
	blurVScene = new THREE.Scene();
	advanceScene = new THREE.Scene();
	diffScene = new THREE.Scene();

	camera = new THREE.OrthographicCamera( w/-2, w/2, h/2, h/-2, -10000, 10000);

	scene.add(camera);
	blurHScene.add(camera);
	blurVScene.add(camera);
	advanceScene.add(camera);
	diffScene.add(camera);


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
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.minFilter = THREE.NearestFilter;
	tex.needsUpdate = true;


	noiseRTT = new THREE.WebGLRenderTarget(sizeX, sizeY, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
	blurHRtt = new THREE.WebGLRenderTarget(sizeX, sizeY, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
	blurVRtt = new THREE.WebGLRenderTarget(sizeX, sizeY, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
	advanceRtt = new THREE.WebGLRenderTarget(sizeX, sizeY, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
	prev = new THREE.WebGLRenderTarget(sizeX, sizeY, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });

	noiseRTT.wrapS = noiseRTT.wrapT = THREE.RepeatWrapping;
	blurHRtt.wrapS = blurHRtt.wrapT = THREE.RepeatWrapping;
	blurVRtt.wrapS = blurVRtt.wrapT = THREE.RepeatWrapping;
	advanceRtt.wrapS = advanceRtt.wrapT = THREE.RepeatWrapping;
	prev.wrapS = prev.wrapT = THREE.RepeatWrapping;

	blurHShader = new THREE.ShaderMaterial({
		uniforms:{
			u_image: { type:'t', value: tex },
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0/sizeX, 1.0/sizeY) }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('blurV').textContent
	});

	blurVShader = new THREE.ShaderMaterial({
		uniforms:{
			u_image: { type:'t', value: blurHRtt },
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0/sizeX, 1.0/sizeY) }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('blurH').textContent
	});

	advanceShader = new THREE.ShaderMaterial({
		uniforms:{
			sampler_prev: { type:'t', value: prev },
			sampler_blur: { type:'t', value: blurVRtt },
			sampler_noise: { type:'t', value: tex },
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0/w, 1.0/h) },
			mouse: { type: 'v2', value: new THREE.Vector2(mouseX, mouseY) },
			rnd: { type: 'v4', value: new THREE.Vector4( Math.random(), Math.random(), Math.random(), Math.random() )},
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('advanceFs').textContent
	});


	diffShader = new THREE.ShaderMaterial({
		uniforms:{
			curr:{ type: 't', value: prev },
			prev: {type: 't', value: advanceRtt }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('diffShader').textContent
	});

	baseShader = new THREE.ShaderMaterial({
		uniforms:{
			tex:{ type: 't', value: blurVRtt }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader').textContent
	});

	var planeGeo = new THREE.PlaneBufferGeometry(w, h);
	var planeMat = new THREE.MeshBasicMaterial({map: tex});
	
	plane = new THREE.Mesh(planeGeo, baseShader);
	scene.add(plane);

	plane = new THREE.Mesh(planeGeo, blurHShader);
	blurHScene.add(plane);

	plane = new THREE.Mesh(planeGeo, blurVShader);
	blurVScene.add(plane);

	plane = new THREE.Mesh(planeGeo, advanceShader);
	advanceScene.add(plane);

	plane = new THREE.Mesh(planeGeo, diffShader);
	diffScene.add(plane);

	renderer = new THREE.WebGLRenderer({ antialias:false});

  	renderer.setSize(w,h);

  	container.appendChild(renderer.domElement);

  	render();

}


function render(){
	//time += 0.01;

	advanceShader.uniforms.mouse.value = new THREE.Vector2(mouseX, mouseY);
	advanceShader.uniforms.rnd.value = new THREE.Vector4(Math.random(), Math.random(),Math.random(),Math.random());

	if(it > 0 ){
		noiseRTT.minFilter = noiseRTT.magFilter = THREE.LinearFilter;
		blurHRtt.minFilter = blurHRtt.magFilter = THREE.LinearFilter;
		blurVRtt.minFilter = blurVRtt.magFilter = THREE.LinearFilter;
		prev.minFilter = prev.magFilter = THREE.NearestFilter;
		advanceRtt.minFilter = advanceRtt.magFilter = THREE.NearestFilter;
	} else {
		noiseRTT.minFilter = noiseRTT.magFilter = THREE.NearestFilter;
		blurHRtt.minFilter = blurHRtt.magFilter = THREE.NearestFilter;
		blurVRtt.minFilter = blurVRtt.magFilter = THREE.NearestFilter;
		prev.minFilter = prev.magFilter = THREE.NearestFilter;
		advanceRtt.minFilter = advanceRtt.magFilter = THREE.NearestFilter;
	}

	

	renderer.render(blurHScene, camera, blurHRtt, true);
	renderer.render(blurVScene, camera, blurVRtt, true);

	

	renderer.render(advanceScene, camera, advanceRtt, true);	
	
	renderer.render(scene, camera, prev, true);
	renderer.render(advanceScene, camera);

	//renderer.render(diffScene, camera);

	
	
	blurHShader.uniforms.u_image.value = advanceRtt;
	
	
	//diffShader.uniforms.curr.value = advanceRtt;
	//diffShader.uniforms.prev.value = advanceRtt;


	//it = -it;

		window.requestAnimationFrame(render);
}





