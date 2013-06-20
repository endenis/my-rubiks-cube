// my-rubiks-cube - https://github.com/endenis/my-rubiks-cube

var Cube = function(i, j, k) {
    var blue   = 0x007FFF;
    var orange = 0xFFBF00;
    var green  = 0x8DB600;
    var red    = 0xE32636;
    var white  = 0xF2F3F4;
    var yellow = 0xFDE910;

    this.sides = [blue, green, white, yellow, red, orange];
    var materials = [];
    for (var a = 0; a < 6; a++) {
        materials.push(new THREE.MeshLambertMaterial( { color: this.sides[a] } ));
    }
    this.location = { i: i, j: j, k: k };
    this.geometry = new THREE.CubeGeometry(100, 100, 100);
    this.mesh     = new THREE.Mesh(this.geometry, new THREE.MeshFaceMaterial(materials));
    this.mesh.position = new THREE.Vector3(size * (i - 1), size * (j - 1), size * (k - 1));
}

positionToLocation = function(position) {
    return { i: position.x / size + 1, j: position.y / size + 1, k: position.z / size + 1};
}

function logXYZ(text, x, y, z)
{
    console.log(text + " (" + x + ", ", y, ", ", z, ")");
}

var camera, scene, renderer, projector, ray;
var x_rotation = 0, y_rotation = 0, z_rotation = 0;
var radius = 700;
var isMouseDown = false;
var mouseX, mouseY;
var onMouseDownPosition, onMouseDownTheta = 45, onMouseDownPhi = 60;
var theta = 45, phi = 60;
var objects = [];
var cubes;
var size = 105;

var intersects1 = [];

init();
animate(new Date().getTime());

function add_line(posX, posY, posZ, color) {
    var lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(
        new THREE.Vector3(-posX, -posY, -posZ),
        new THREE.Vector3( posX,  posY,  posZ)
    );
    var lineMat = new THREE.LineBasicMaterial({color: color, lineWidth: 1});
    var line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
}

function init() {
    onMouseDownPosition = new THREE.Vector2();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    scene = new THREE.Scene();

    add_line(1000, 0, 0, new THREE.Color(0x770000));
    add_line(0, 1000, 0, new THREE.Color(0x007700));
    add_line(0, 0, 1000, new THREE.Color(0x000077));
    theCube();

    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position = camera.position;
    scene.add(pointLight);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    projector = new THREE.Projector();
    update_camera();
    ray = new THREE.Ray(camera.position, null);
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousewheel', function(event) {
            radius -= event.wheelDeltaY;
            update_camera();
        }, false);
    document.addEventListener('mousemove',  onDocumentMouseMove, false);
    document.addEventListener('mousedown',  onDocumentMouseDown, false);
    document.addEventListener('mouseup',  function(event) {
            event.preventDefault();
            isMouseDown = false;
            onMouseDownPosition.x = event.clientX - onMouseDownPosition.x;
            onMouseDownPosition.y = event.clientY - onMouseDownPosition.y;
        }, false);
}

function update_camera() {
    camera.updateMatrix();
    camera.position.x = radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.y = radius * Math.sin(phi * Math.PI / 360)
    camera.position.z = radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);;
    camera.lookAt(scene.position);
}

function animate(t) {
    renderer.render(scene, camera);
    requestAnimationFrame(animate)
}


function onDocumentMouseDown(event) {
    event.preventDefault();
    isMouseDown = true;
    onMouseDownTheta = theta;
    onMouseDownPhi = phi;
    onMouseDownPosition.x = event.clientX;
    onMouseDownPosition.y = event.clientY;

    var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
    projector.unprojectVector(vector, camera);
    ray = new THREE.Ray(camera.position, null);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        console.log("intersects > 0");
        console.log(intersects[0].object);
    }
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    if (isMouseDown) {
        theta = -(event.clientX - onMouseDownPosition.x) * 0.5 + onMouseDownTheta;
        phi   =  (event.clientY - onMouseDownPosition.y) * 0.5 + onMouseDownPhi;
        if (phi < -180)
            phi =  -180;
        else if (phi > 180)
            phi = 180;
        update_camera();
    }
}

function onWindowResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    update_camera();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function theCube() {
    var cube;
    cubes = [];
    for (var i = 0; i < 3; i++) {
        cubes.push([]);
        for (var j = 0; j < 3; j++) {
            cubes.push([]);
            for (var k = 0; k < 3; k++) {
                if (i == 1 && j == 1 && k == 1)
                    continue;
                var cube = new Cube(i, j, k);
                cubes[i, j, k] = cube;
                objects.push(cube.mesh);
                scene.add(cube.mesh);
            }
        }
    }
    var black_material = new THREE.MeshLambertMaterial( { color: 0x000000 } );
    var black_mesh = new THREE.Mesh(new THREE.CubeGeometry(300, 300, 300), black_material);
    black_mesh.position = new THREE.Vector3(0, 0, 0);
    scene.add(black_mesh);
}

