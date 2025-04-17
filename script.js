//Set height for property section in customizer
document.addEventListener('DOMContentLoaded', setPropertiesHeight);
window.addEventListener('resize', setPropertiesHeight);

function setPropertiesHeight() {
    const customizer = document.querySelector('.customizer');
    const sections = document.querySelector('.sections');
    const properties = document.querySelector('.properties');
    const propertySection = document.querySelector('.property-section');
    const otherPropertiesSection = document.querySelector('.other-properties');

    const customizerHeight = customizer.offsetHeight;
    const sectionsHeight = sections.offsetHeight;

	if (propertySection || otherPropertiesSection) {
		let calculateHeight = customizerHeight - sectionsHeight;
		properties.style.height = calculateHeight + 'px';
    	propertySection.style.height = calculateHeight + 'px';
		otherPropertiesSection.style.height = calculateHeight + 'px';
	}
}

setPropertiesHeight();

//Body Size Sliders
// let planetSize = 0.9;
// const planetSizeSlider = document.querySelector('.planet-size');

// planetSizeSlider.addEventListener("input", function() {
// 	planetSize = parseFloat(planetSizeSlider.value); //Convert string value from slider into a number
// 	if (currentModels.body) {
// 		scaleAndPositionBodyModel(currentModels.body);
// 		loadPlantsOnPlanet(currentModels.body, parseInt(plantCountSlider.value));
// 		renderer.render(scene, camera);
// 	}
// });

// THREE.JS
import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';

const loader = new GLTFLoader();
const scene = new THREE.Scene();
let currentModels = { 
	body: null, 
	plants: new THREE.Group()
}; //No models at the start

let newPlantModel = null;
let plantSize = 0.2;
let planetSize = 0.9;
let planetRadiusOffset = 5;

//Load JSON
$(document).ready(function() {

	//Get data from JSON
	$.getJSON('models.json', function(data) {
		console.log("JSON Data:", data);
		setSectionSwitching(data);
		imageClick(data);
		loadModel(data.body.initialModel, "body"); //Initially load the first model and categorize it (from the types in currentModels)

		setTimeout(() => {
            console.log("Initial currentModels.plants.children:", currentModels.plants.children);
        }, 1000);
	});

	function setSectionSwitching(data) {
		const sections = document.querySelector('.sections');
		const bodySection = document.querySelector('.property-section');
		const otherSection = document.querySelector('.other-properties');
		const sectionIcons = document.querySelectorAll('.icons');

		sectionIcons.forEach(icon => {
			icon.addEventListener('click', function() {
				const sectionId = this.id;
				console.log("Clicked section:", sectionId);

				bodySection.style.display = 'none';
				otherSection.style.display = 'none';
				//Hide all sections at the beginning

				if (sectionId === 'body') {
					bodySection.style.display = 'flex';
					loadShapeImages('body', data);
					currentPart = 'body';
				}
				else if (sectionId === 'plants') {
					otherSection.style.display = 'flex';
					loadPlantsControls();
					currentPart = 'plants';
				}
			});
		});
		
		//Initially show the body section
		bodySection.style.display = 'flex';
		loadShapeImages('body', data);

		//Load body shape images
		function loadShapeImages(part, jsonData) {
			const container = document.querySelector('.shapes-container');
			container.innerHTML = ''; //Remove previous images
			for (const shapeId in jsonData[part].images) {
				const img = document.createElement('img');
				img.classList.add('shape');
				img.id = shapeId;
				img.src = jsonData[part].images[shapeId];
				container.appendChild(img);
			}
		}
	}

	let currentPart = 'body';

	function imageClick(data) {
		$(document).on("click", ".shapes-container img, .other-shapes-container img", function() {
			const modelId = this.id;
			if (currentPart === 'body') {
				changeModel(data.body.shapes[modelId], "body");
			}
			else if (currentPart === 'plants') {
				// loadPlantsOnPlanet(currentModels.body, parseInt(plantCountSlider.value));
				// changeModel(data.plants.shapes[modelId], "plants");
				const newPlantModelPath = data.plants.shapes[modelId]; 
				console.log("Attempting to load plant model path:", newPlantModelPath);
				loadNewPlantModel(newPlantModelPath);
				//Change plant model path for the instance in the plant group when a plant image is clicked
			}
		});
	}

	function loadNewPlantModel(modelPath) {
		loader.load(modelPath, gltf => {
			newPlantModel = gltf.scene;
			newPlantModel.scale.set(plantSize, plantSize, plantSize);

			updatePlantVisuals();

			console.log("New plant model loaded:", newPlantModel);
			console.log("New plant model.children:", newPlantModel.children);

			updatePlantVisuals();
		}, undefined, error => {
			console.error("Error laoding new plant model:", error);
		});
	}

	function updatePlantVisuals() {
		if (!newPlantModel || !currentModels.plants || currentModels.plants.children.length === 0) {
			return;
		}

		const newPlantMesh = newPlantModel.children[1];

		//Switch original plant mesh to new one and update its properties
		currentModels.plants.children.forEach(plantInstance => {
			if (plantInstance.children.length > 0 && plantInstance.children[1].isMesh && newPlantMesh) {
				const existingPlantMesh = plantInstance.children[1];

				existingPlantMesh.geometry.dispose();
				existingPlantMesh.geometry = newPlantMesh.geometry;

				existingPlantMesh.material = newPlantMesh.material;
				existingPlantMesh.material.needsUpdate = true;
			}
		});

		renderer.render(scene, camera);
	}
});

//Main Setup
const canvas = document.querySelector("#alien-canvas");

const sizes = {
    width: canvas.clientWidth,
    height: canvas.clientHeight
};

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 2, 10);

//Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x222222);

//Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

//Resize Event
window.addEventListener("resize", () => {
    sizes.width = canvas.clientWidth;
    sizes.height = canvas.clientHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

//Rotation Animation
function animate() {
    // if (currentModels.body) {
    //     currentModels.body.rotation.y += 0.005;
    // }

    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

//Background
const backgroundImages = document.querySelectorAll('.background img')


const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/backgrounds/space background 1.jpeg', function(texture) {
  scene.background = texture;
});

backgroundImages.forEach(img => {
	img.addEventListener('click', function() {
		const imagePath = this.src;
		const textureLoader = new THREE.TextureLoader();
		textureLoader.load(imagePath, function(texture) {
			scene.background = texture;
			renderer.render(scene, camera);
		});
	});
});

function changeModel(modelPath, type) {
	loadModel(modelPath, type);
}

//Load Model
function loadModel(modelPath, type) {
	loader.load(modelPath, gltf => {
		const model = gltf.scene;
		model.name = type;
		model.userData.path = modelPath;

		console.log(`Loading model: ${modelPath}, type: ${type}`);

		if (currentModels[type]) {
			console.log(`currentModels[${type}] before removal:`, currentModels[type]);
			console.log(`Removing previous model of type: ${type}`);
			scene.remove(currentModels[type]);
			//Remove current model before loading new model

			renderer.render(scene, camera);
			//Update scene to quickly switch models
		}

		scaleAndPositionBodyModel(model);

		scene.add(model);
		currentModels[type] = model; //Updates current model to the loaded model

		applyCanvasTextureToModel();
		// applyColorToModel();

		if (type === 'body') {
			const plantCountSlider = document.querySelector('.plant-count-slider');
			if (plantCountSlider) {
				loadPlantsOnPlanet(currentModels.body, parseInt(plantCountSlider.value));
				scene.add(currentModels.plants);
			}
		}

		console.log("currentModels:", currentModels);
		console.log("scene.children:", scene.children);

	}, undefined, error => {
		console.error(`Error loading ${type} model:`, error);
	});
}

//Body Model Size and Position
function scaleAndPositionBodyModel(model) {
	const box = new THREE.Box3().setFromObject(model); //Create a bounding box around the model
	const center = box.getCenter(new THREE.Vector3()); //Store the center point
	model.position.sub(center); 
	//Subtract the center point from model position so that the center of the model is at (0, 0, 0)

	model.scale.set(planetSize, planetSize, planetSize);
}

//Plant Loader
const plantLoader = new GLTFLoader();
const plantCountSlider = document.querySelector('.plant-count-slider');

function getRandomPointOnSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

function loadPlantModel(callback) {
	plantLoader.load('assets/models/Tree 1.glb', gltf => {
		const plantModel = gltf.scene;
		callback(plantModel);
	}, undefined, error => {
		console.error("Error loading plant model:", error);
	});
}

function loadPlantsOnPlanet(planetModel, numPlants) {
	console.log("loadPlantsOnPlanet called with:", planetModel, numPlants);
	if(!planetModel) {
		console.log("planetModel is null, returning.");
		return;
	}

	currentModels.plants.clear();

	if (newPlantModel) {
		for (let i = 0; i < numPlants; i++) {
			const position = getRandomPointOnSphere(planetSize * planetRadiusOffset);
			const plantInstance = newPlantModel.clone();

			plantInstance.position.copy(position);
			console.log(`Plant ${i} position:`, plantInstance.position);

			plantInstance.lookAt(planetModel.position);
			console.log(`Plant ${i} rotation after lookAt:`, plantInstance.rotation);

			plantInstance.up.set(0, 0, 1);
			plantInstance.rotateX(Math.PI / 2);
			console.log(`Plant ${i} rotation after rotateX:`, plantInstance.rotation);
			
			plantInstance.scale.set(plantSize, plantSize, plantSize);

			currentModels.plants.add(plantInstance);
		}
		scene.add(currentModels.plants);
	}
	else {
		loadPlantModel(initialPlant => {
			newPlantModel = initialPlant;

			for (let i = 0; i < numPlants; i++) {
				const position = getRandomPointOnSphere(planetSize * planetRadiusOffset);
				const plantInstance = initialPlant.clone();
	
				plantInstance.position.copy(position);
				console.log(`Plant ${i} position:`, plantInstance.position);
	
				plantInstance.lookAt(planetModel.position);
				console.log(`Plant ${i} rotation after lookAt:`, plantInstance.rotation);
	
				plantInstance.up.set(0, 0, 1);
				plantInstance.rotateX(Math.PI / 2);
				console.log(`Plant ${i} rotation after rotateX:`, plantInstance.rotation);
				
				plantInstance.scale.set(plantSize, plantSize, plantSize);
	
				currentModels.plants.add(plantInstance);
			}
			scene.add(currentModels.plants);
		});
	}
}

function loadPlantsControls() {
	const plantCountSlider = document.querySelector('.plant-count-slider');
	if (plantCountSlider) {
		plantCountSlider.addEventListener('input', function() {
			if (currentModels.body) {
				loadPlantsOnPlanet(currentModels.body, parseInt(this.value));
			}
		});

		if (currentModels.body) {
			loadPlantsOnPlanet(currentModels.body, parseInt(plantCountSlider.value));
		}
	}
}

//Plant Color
const topColorPicker = document.getElementById('top-color-picker');
const stemColorPicker = document.getElementById('stem-color-picker');

function colorPlant(model, index, color) {
	const child = model.children[index];
	if (child && child.isMesh) {
		const mesh = child;
		if (mesh.material) {
			if (Array.isArray(mesh.material)) {
				mesh.material.forEach(material => {
					if (material.color) {
						material.color.set(color);
						material.needsUpdate = true;
					}
				});
			}
			else {
				if (mesh.material.color) {
					mesh.material.color.set(color);
					mesh.material.needsUpdate = true;
				}
			}
		}	
	}
}

function colorExistingPlants(topColor, stemColor) {
	currentModels.plants.children.forEach(plantInstance => {
		colorPlant(plantInstance, 1, topColor);
		colorPlant(plantInstance, 0, stemColor);
	});
	renderer.render(scene, camera);
}

topColorPicker.addEventListener('input', function(event) {
	const selectedColor = event.target.value;
	
	if (newPlantModel){
		colorPlant(newPlantModel, 1, selectedColor);
		renderer.render(scene, camera);
	}

	const currentStemColor = stemColorPicker.value
	colorExistingPlants(selectedColor, currentStemColor);
});

stemColorPicker.addEventListener('input', function(event) {
	const selectedColor = event.target.value;
	
	if (newPlantModel){
		colorPlant(newPlantModel, 0, selectedColor);
		renderer.render(scene, camera);
	}

	const currentTopColor = topColorPicker.value
	colorExistingPlants(currentTopColor, selectedColor)
});

//Pattern Color
const backgroundColorPicker = document.getElementById('background-color');
const patternColorPicker = document.getElementById('pattern-color');
let backgroundColor = '#ff0000';
let patternColor = '#ffffff';

backgroundColorPicker.addEventListener('input', function(event) {
	backgroundColor = event.target.value;
	drawPattern();
	applyCanvasTextureToModel()
});
patternColorPicker.addEventListener('input', function(event) {
	patternColor = event.target.value;
	drawPattern();
	applyCanvasTextureToModel()
});

//Pattern Maker Slider
let patternWidth = 40;
let patternHeight = 40;
let patternSize = 0;
const patternWidthSlider = document.querySelector('.pattern-width');
const patternHeightSlider = document.querySelector('.pattern-height');
const patternSizeSlider = document.querySelector('.pattern-individual-size');

patternWidthSlider.addEventListener("input", function() {
	patternWidth = parseFloat(patternWidthSlider.value); //Convert string value from slider into a number
	drawPattern();
	applyCanvasTextureToModel()
});
patternHeightSlider.addEventListener("input", function() {
	patternHeight = parseFloat(patternHeightSlider.value); //Convert string value from slider into a number
	drawPattern();
	applyCanvasTextureToModel()
});
patternSizeSlider.addEventListener("input", function() {
	patternSize = parseFloat(patternSizeSlider.value); //Convert string value from slider into a number
	drawPattern();
	applyCanvasTextureToModel()
});

//Pattern Maker
const patternCanvas = document.getElementById('pattern-maker');
let currentPatternShape = 'none';

function setPatternShape(shapeName) {
	currentPatternShape = shapeName;
	drawPattern();
	applyCanvasTextureToModel();
}

const patternShapesContainer = document.querySelector('.pattern-shape');
if (patternShapesContainer) {
	patternShapesContainer.addEventListener('click', function(event) {
		const clickedElement = event.target;
		const shapeId = clickedElement.id;
		setPatternShape(shapeId);
	});
}

function applyCanvasTextureToModel() {
	function getCanvasTexture() {
		return patternCanvas.toDataURL();
	}

	const textureLoader = new THREE.TextureLoader();
	textureLoader.load(getCanvasTexture(), function(texture) {
		if (currentModels.body) {
			currentModels.body.traverse(function(child) {
				if (child.isMesh) {
					if (Array.isArray(child.material)) {
						child.material.forEach(mat => {
							mat.map = texture;
							mat.needsUpdate = true;
						});
					}
					else {
						child.material.map = texture;
						child.material.needsUpdate = true;
					}
				}
			});
			renderer.render(scene, camera);
		}
	});
}

//Pattern Draw
function drawPattern() {
	const ctx = patternCanvas.getContext('2d');
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);

	ctx.fillStyle = patternColor;

	for (let i = 0; i < patternCanvas.width + 10; i += patternWidth) {
		for (let j = 0; j < patternCanvas.height; j += patternHeight) {
			switch (currentPatternShape) {
				case 'star': 
				drawStar(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'circle': 
				drawCircle(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'triangle': 
				drawTriangle(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'horizontal': 
				drawHorizontal(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'vertical': 
				drawVertical(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'diamond': 
				drawDiamond(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'heart': 
				drawHeart(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'arrow': 
				drawArrow(ctx, i, j, 5 + patternSize, 12 + patternSize, 5);
				break;
				case 'none': 
				break;
			}
		}
	}
}

//Star Pattern
function drawStar(ctx, x, y, radius1, radius2, npoints) 
{
	let angle = (Math.PI * 2) / npoints;
	let halfAngle = angle / 2.0;
	ctx.beginPath();
	for (let a = 0; a < Math.PI * 2; a += angle) {
		let sx = x + Math.cos(a) * radius2;
		let sy = y + Math.sin(a) * radius2;
		ctx.lineTo(sx, sy);
		sx = x + Math.cos(a + halfAngle) * radius1;
		sy = y + Math.sin(a + halfAngle) * radius1;
		ctx.lineTo(sx, sy);
	}
	ctx.closePath();
	ctx.fill();
}

//Circle Pattern
function drawCircle(ctx, x, y, radius) 
{
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

//Triangle Pattern
function drawTriangle(ctx, x, y, size) 
{
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.lineTo(x - size / 2, y + size / 2);
    ctx.closePath();
    ctx.fill();
}

//Horizontal Stripes Pattern
function drawHorizontal(ctx, x, y, stripeHeight) {
    ctx.fillRect(x, y, patternWidth, stripeHeight); 
		ctx.fillRect(x, y + stripeHeight * 2, patternWidth, stripeHeight);
}

//Vertical Stripes Pattern
function drawVertical(ctx, x, y, stripeWidth) 
{
    ctx.fillRect(x, y, stripeWidth, patternHeight);
    ctx.fillRect(x + stripeWidth * 2, y, stripeWidth, patternHeight);
}

//Diamond Pattern
function drawDiamond(ctx, x, y, width, height) 
{
    ctx.beginPath();
    ctx.moveTo(x, y - height / 2);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x, y + height / 2);
    ctx.lineTo(x - width / 2, y);
    ctx.closePath();
    ctx.fill();
}

//Heart Pattern
function drawHeart(ctx, x, y, size) 
{
    ctx.beginPath();
    ctx.arc(x - size / 4, y - size / 4, size / 4, Math.PI, 0);
    ctx.arc(x + size / 4, y - size / 4, size / 4, Math.PI, 0);
    ctx.lineTo(x, y + size / 2);
    ctx.closePath();
    ctx.fill();
}

//Arrow Pattern 
function drawArrow(ctx, x, y, width, height) 
{
    ctx.beginPath();
    ctx.ellipse(x, y - height / 4, width / 2, height / 4, 0, 0, Math.PI);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
    ctx.fill();
}

//Size canvas to match height of parent div
$(document).ready(function() {
    const patternCanvasDiv = document.querySelector('.pattern-shape');

    function resizeCanvas() {
		patternCanvas.width = patternCanvasDiv.offsetWidth;
        patternCanvas.height = patternCanvasDiv.offsetHeight;
        drawPattern();
    }

    resizeCanvas(); 
    $(window).on('resize', resizeCanvas);
    drawPattern();
});

// Load Arms
// const armLoader = new GLTFLoader();
// let leftArmPivot, rightArmPivot;
// let xArm = 2;
// let yArm = 0;
// let rArm = 80;
// let rArmScale = 1;
// let lArmScale = 1.5;

// function loadArms() {
//     armLoader.load('assets/models/Alien Limb.glb', function (gltf) {
//         if (!currentModels.body) {
//             console.error("Body model is not loaded yet!");
//             return;
//         }

//         const armModel = gltf.scene;
//         const box = new THREE.Box3().setFromObject(armModel);
//         armModel.position.y -= box.max.y;

//         leftArmPivot = new THREE.Group();
//         leftArmPivot.add(armModel);
//         leftArmPivot.position.set(-xArm, yArm, 0);
//         leftArmPivot.rotation.set(0, 0, -rArm * (Math.PI / 180));
//         leftArmPivot.scale.set(rArmScale, lArmScale, rArmScale);

//         const rightArmModel = armModel.clone();
//         rightArmPivot = new THREE.Group();
//         rightArmPivot.rotation.set(0, 0, rArm * (Math.PI / 180));
//         rightArmPivot.add(rightArmModel);
//         rightArmPivot.scale.set(rArmScale, lArmScale, rArmScale);
//         rightArmModel.scale.x *= -1;
//         rightArmPivot.position.set(xArm, yArm, 0);

//         currentModels.body.add(leftArmPivot);
//         currentModels.body.add(rightArmPivot);

//         console.log("Arms loaded and attached!");
//     });
// }

// Load Legs
// const legLoader = new GLTFLoader();
// let leftLegPivot, rightLegPivot;
// let xLeg = 0.5;
// let yLeg = -1.8;
// let rLeg = 0;
// let legScale = 1;

// function loadLegs() {
//     legLoader.load('assets/models/Alien Limb.glb', function (gltf) {
//         if (!currentModels.body) {
//             console.error("Body model is not loaded yet!");
//             return;
//         }

//         const legModel = gltf.scene;
//         const box = new THREE.Box3().setFromObject(legModel);
//         legModel.position.y -= box.max.y;

//         leftLegPivot = new THREE.Group();
//         leftLegPivot.add(legModel);
//         leftLegPivot.position.set(-xLeg, yLeg, 0);
//         leftLegPivot.rotation.set(0, 0, -rLeg * (Math.PI / 180));
//         leftLegPivot.scale.set(legScale, legScale, legScale);

//         const rightLegModel = legModel.clone();
//         rightLegPivot = new THREE.Group();
//         rightLegPivot.rotation.set(0, 0, rLeg * (Math.PI / 180));
//         rightLegPivot.add(rightLegModel);
//         rightLegPivot.scale.set(legScale, legScale, legScale);
//         rightLegModel.scale.x *= -1;
//         rightLegPivot.position.set(xLeg, yLeg, 0);

//         model.add(leftLegPivot);
//         model.add(rightLegPivot);

//         console.log("Legs loaded and attached!");
//     });
// }

// Load the body models (this starts everything)
// loadBodyModels();


	//Legs
	// const legLoader = new GLTFLoader();
	// let leftLegPivot, rightLegPivot;
	// let xLeg = 0.5;
	// let yLeg = -1.8;
	// let rLeg = 10;
	// let rLegScale = 1;
	// let lLegScale = 1;

	// legLoader.load(
	// 'assets/models/Alien Limb.glb',
	// function (gltf) {
	// 	const legModel = gltf.scene;

	// 	// Get bounding box and bottom
	// 	const box = new THREE.Box3().setFromObject(legModel);
	// 	const size = box.getSize(new THREE.Vector3());
	// 	const max = box.max;

	// 	// Move arm up so the bottom is at Y=0 (the pivot point)
	// 	legModel.position.y -= max.y;

	// 	// Create left arm pivot
	// 	leftLegPivot = new THREE.Group();
	// 	leftLegPivot.add(legModel);

	// 	// Position left arm where shoulder would roughly be
	// 	leftLegPivot.position.set(-xLeg, yLeg, 0); // Adjust as needed
	// 	leftLegPivot.rotation.set(0, 0, -rLeg * (Math.PI / 180)); 
	// 	bodyModel.add(leftLegPivot); // Attach to body 
	// 	leftLegPivot.scale.set(rLegScale, lLegScale, rLegScale);

	// 	// Clone for right arm
	// 	const rightLegModel = legModel.clone();
	// 	rightLegPivot = new THREE.Group();
	// 	rightLegPivot.rotation.set(0, 0, rLeg * (Math.PI / 180));  
	// 	rightLegPivot.add(rightLegModel);
	// 	rightLegPivot.scale.set(rLegScale, lLegScale, rLegScale);

	// 	// Mirror the arm along X
	// 	rightLegModel.scale.x *= -1;

	// 	// Position right arm
	// 	rightLegPivot.position.set(xLeg, yLeg, 0); // Adjust to mirror shoulder position
	// 	bodyModel.add(rightLegPivot);

	// 	console.log("Arms loaded and attached!");
	// },
	// undefined,
	// function (error) {
	// 	console.error('Error loading arm model:', error);
	// }
	// );

	//Legs
	// const legLoader = new GLTFLoader();
	// let legModel;

	// legLoader.load(
	// 'assets/Alien Limb.glb',
	// function (gltf) {
	// 	legModel = gltf.scene;

	// 	legModel.scale.set(1, 2, 1);

	// 	legToBody()
	// });

	// let rightLeg, leftLeg;

	// function legToBody() {
	// 	rightLeg = legModel.clone();
	// 	leftLeg = legModel.clone();

	// 	bodyModel.add(rightLeg);
	// 	bodyModel.add(leftLeg);

	// 	rightLeg.position.set(0.5, -2, 0)
	// 	leftLeg.position.set(-0.5, -2, 0)
	// 	leftLeg.scale.x *= -1;

	// 	console.log("Legs attached to body.");
	// }

	// document.addEventListener('DOMContentLoaded', function() {
// 	let patternCanvas;

// 	function setup() {
// 		patternCanvas = createCanvas(256, 256);
// 		patternCanvas.parent('.pattern-canvas');
// 	}

// 	function draw() {
// 		background(220)
// 		drawPattern()
// 	}

// 	function drawPattern() {
// 		fill(255, 0, 0); 
// 		for (let i = 20; i < width; i += 40) {
// 			for (let j = 20; j < height; j += 40) {
// 				star(i, j, 5, 12, 5)
// 			}
// 		}
// 	}

// 	function star(x, y, radius1, radius2, npoints) {
// 	let angle = TWO_PI / npoints;
// 	let halfAngle = angle / 2.0;
// 	beginShape();
// 	for (let a = 0; a < TWO_PI; a += angle) {
// 		let sx = x + cos(a) * radius2;
// 		let sy = y + sin(a) * radius2;
// 		vertex(sx, sy);
// 		sx = x + cos(a + halfAngle) * radius1;
// 		sy = y + sin(a + halfAngle) * radius1;
// 		vertex(sx, sy);
// 	}
// 	endShape(CLOSE);
// 	//https://archive.p5js.org/examples/form-star.html
// 	}

// 	setup();
// });

// Model Loading
// const bodyLoader = new GLTFLoader();
// let bodyModel;

// bodyLoader.load( bodyModel, 
// 	function (gltf) {
// 		bodyModel = gltf.scene;
// 		const box = new THREE.Box3().setFromObject(bodyModel);
// 		const center = box.getCenter(new THREE.Vector3());
// 		bodyModel.position.sub(center);

// 		const size = box.getSize(new THREE.Vector3()).length();
// 		const scaleFactor = 10 / size;
// 		bodyModel.scale.setScalar(scaleFactor);

// 		scene.add(bodyModel);
// 		console.log("Model loaded successfully");
// 	},
// 	function (xhr) {
// 		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
// 	},
// 	function (error) {
// 		console.error('Error loading model:', error);
// 	}
// )

//Color Picker
// const bodyColor = document.getElementById('body-color');
// let currentColor = '#ff2e2e'

// bodyColor.addEventListener('input', function(event) {
// 	currentColor = event.target.value;
// 	applyColorToModel();
// });

// function applyColorToModel() {
// 	if (currentModels.body) {
// 		currentModels.body.traverse(function(child) {
// 			if (child.isMesh) {
// 				if(Array.isArray(child.material)) {
// 					child.material.forEach(mat => {
// 						mat.color.set(currentColor);
// 						mat.needsUpdate = true;
// 					});
// 				}
// 				else {
// 					child.material.color.set(currentColor);
// 					child.material.needsUpdate = true;
// 				}
// 			}
// 		});
// 		renderer.render(scene, camera);
// 	}
// }
