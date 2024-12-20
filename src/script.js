import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js' 
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
//Scroll
let scrollY = window.scrollY
let currentSection = 0

window.addEventListener('scroll', () => {
    scrollY = window.scrollY
    const newSection = Math.floor(scrollY / sizes.height)
    
    if(newSection !== currentSection) {
        currentSection = newSection
        console.log('Current section:', currentSection)
        
        // Keep background black for all sections
        scene.background = new THREE.Color(0x000000)
        
        // Section 0 - Galaxy
        if(points) {
            points.visible = currentSection === 0

        }
        //Sun
        if(Blackhole){
            Blackhole.visible = currentSection ===0
        }
        //Cube
        if(cube){
            cube.visible = currentSection === 1
        }

        // Section 2 - Cat
        if(model) {
            model.visible = currentSection === 2
        }
        //Particles
        if(particles){
            particles.visible = currentSection === 2
        }

        // Update camera for each section
        if(currentSection === 0) {
            camera.position.set(0, 2, 5)
            camera.lookAt(0,0,0)
        } else if(currentSection === 1) {
            camera.position.set(0, 0, 5)  
            camera.lookAt(0, 0, 0)
        }
        else if(currentSection === 2){
            camera.position.set(0,5,0)
            camera.lookAt(0,-3,0)
        }
        
        // GUI visibility
        if(currentSection === 0) {
            gui.show()
        } else {
            gui.hide()
        }
    }
})

//Enlarge Function for mouse event
function enlargeModel(model) {
    // Enlarge the model's scale
    model.scale.set(7, 7, 7);
  }

//Raycaster and Mouse events
// 

// Create a Raycaster and a Mouse object
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Intersect the ray with the scene
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;

    // Check if the clicked object is your model
    if (object === model) {
      // Trigger enlargement and sound playback
      enlargeModel(object);
      playSound();
    }
  }
});
/**
 * Textures
 */

const textureLoader = new THREE.TextureLoader() 
const particleTexture = textureLoader.load('/textures/particles/12.png') 
const pointTexture = textureLoader.load('/textures/particles/9.png')
const BlackholeTexture = textureLoader.load('/textures/particles/3.png')
const sunTexture = textureLoader.load('/textures/particles/sun.jpg')
// ... 
/** 
* Models 
*/ 
 
//load the Model
const loader = new GLTFLoader();

loader.load('cat/scene.gltf', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  model.position.set(-5, 0, 0);
  model.scale.set(5, 5, 5);
});
// Ambient light
const ambientLight = new THREE.AmbientLight('#ffffff', 0.3)
scene.add(ambientLight)
//Geometry

const particlesGeometry = new THREE.BufferGeometry()
const count = 50000

const positions = new Float32Array(count * 3)
const colors = new Float32Array(count * 3)

for(let i = 0; i < count * 3; i++)
{
    positions[i] = (Math.random() - 0.5) * 10
    colors[i] = Math.random()
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

/**
 * Galaxy
 */
const parameters = {}
parameters.count = 100000
parameters.size = 0.01
parameters.radius = 5
parameters.branches = 3
parameters.spin = 1
parameters.randomness = 0.2
parameters.randomnessPower = 3
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'

let geometry = null
let material = null
let points = null

const generateGalaxy = () =>
{
    // Destroy old galaxy
    if(points !== null)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++)
    {
        // Position
        const i3 = i * 3

        const radius = Math.random() * parameters.radius

        const spinAngle = radius * parameters.spin
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2
        
        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius

        positions[i3    ] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[i3 + 1] = randomY
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        // Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)
        
        colors[i3    ] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
/**
     * Material
     */
    material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        alphaMap: pointTexture
})

/**
 * Points
 */
points = new THREE.Points(geometry, material)
scene.add(points)
}
gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'spin').min(- 5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

generateGalaxy()




//End of Galaxy generator
// Materials

const particlesMaterial = new THREE.PointsMaterial()

particlesMaterial.size = 0.1
particlesMaterial.sizeAttenuation = true

particlesMaterial.color = new THREE.Color('#ff88cc')

particlesMaterial.transparent = true
particlesMaterial.alphaMap = particleTexture
particlesMaterial.alphaTest = 0.001
// particlesMaterial.depthTest = false
particlesMaterial.depthWrite = false
particlesMaterial.blending = THREE.AdditiveBlending

particlesMaterial.vertexColors = true

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)



/**
 * Blackhole or Sun cause blackhole isn't texture-able??
 */
const sphere = new THREE.SphereGeometry(0.5, 32, 32)
const BlackholeMaterial = new THREE.MeshBasicMaterial()
    BlackholeMaterial.map = sunTexture
    BlackholeMaterial.emissiveIntensity = 10.0
    BlackholeMaterial.needsUpdate = true
    BlackholeMaterial.transparent = true
    BlackholeMaterial.opacity = 1
    //BlackholeMaterial.depthTest = false
    BlackholeMaterial.color = new THREE.Color('#ffffff')
    BlackholeTexture.wrapS = THREE.RepeatWrapping;
    BlackholeTexture.wrapT = THREE.RepeatWrapping;

const Blackhole = new THREE.Mesh(sphere, BlackholeMaterial)
scene.add(Blackhole)

//test
const texture = textureLoader.load('/textures/particles/14.png');

const testmaterial = new THREE.MeshBasicMaterial({ map: texture });
const testgeometry = new THREE.BoxGeometry(1, 1, 1);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
const cube = new THREE.Mesh(testgeometry, testmaterial);
cube.position.set(0, 2, 0)
scene.add(cube);

//Light
const light = new THREE.PointLight( 0xffffff, 10, 50 );
light.position.set( 0, 0, 0 );
scene.add( light );

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 5
camera.position.y = 2
camera.lookAt(0,0,0);
scene.add(camera)

// Controls
//const controls = new OrbitControls(camera, canvas)
//controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
    //alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

let time = 0;
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    //controls.update()

    //Spin the galaxy?
    points.rotation.y += 0.005;
    //Twinkle twinkle
    time += 0.01; // Adjust the speed of the twinkling

    // Apply the twinkling effect only to the particles
    let scale = 1 + 0.2 * Math.sin(time); // Adjust amplitude and frequency
    particles.scale.set(scale, scale, scale);

    let opacity = 0.8 + 0.2 * Math.sin(time * 2); // Adjust amplitude and frequency
    particles.material.opacity = opacity;

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()