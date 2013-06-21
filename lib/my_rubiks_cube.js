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

var positionToLocation = function(position) {
    return { i: position.x / size + 1, j: position.y / size + 1, k: position.z / size + 1};
}

var getCube = function(location) {
    return cubes[location.i][location.j][location.k];
}

var container;
var camera, scene, renderer, projector, ray;
var x_rotation = 0, y_rotation = 0, z_rotation = 0;
var radius = 700;
var isMouseDown = false;
var mouseX, mouseY;
var onMouseDownPosition, onMouseDownTheta = 45, onMouseDownPhi = 60;
var theta = 45, phi = 60, no_rotation = false;
var objects = [];
var cubes, last_clicked;
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
    container = document.getElementById('container');
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
    container.appendChild(renderer.domElement);
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
            no_rotation = false;
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
    intersection(function(intersect) {
        no_rotation = true;
        last_clicked = positionToLocation(intersect.object.position);
        console.log(last_clicked);
        container.style.cursor = "col-resize";
    });
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    if (isMouseDown) {
        xAngle = -(event.clientX - onMouseDownPosition.x) * 0.5;
        yAngle =  (event.clientY - onMouseDownPosition.y) * 0.5;
        if (no_rotation) {
            objectToRotate = getCube(last_clicked);
            objectToRotate.rotateOnAxis(new THREE.Vector3(0, 1, 0), yAngle * Math.PI / 360);
        }
        else {
            theta = xAngle + onMouseDownTheta;
            phi   = yAngle + onMouseDownPhi;
            if (phi < -180)
                phi =  -180;
            else if (phi > 180)
                phi = 180;
            update_camera();
        }
    }
    intersection(function(intersect) {
        container.style.cursor = 'pointer';
    }, function() {
        container.style.cursor = 'move';
    });
}

var intersection = function(on_intersection, on_zero_intersections) {
    var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
    projector.unprojectVector(vector, camera);
    ray = new THREE.Ray(camera.position, null);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0)
        on_intersection(intersects[0]);
    else if (on_zero_intersections !== undefined)
        on_zero_intersections();
}

function onWindowResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    update_camera();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function theCube() {
    var cube;
    cubes = [];
    var number_of_cubes = 3;
    for (var i = 0; i < number_of_cubes; i++) {
        cubes.push([]);
        for (var j = 0; j < number_of_cubes; j++) {
            cubes[i].push([]);
            for (var k = 0; k < number_of_cubes; k++) {
                if (i == 1 && j == 1 && k == 1)
                    continue;
                var cube = new Cube(i, j, k);
                cube_object = new THREE.Object3D();
                cube_object.add(cube.mesh);
                cubes[i][j].push(cube_object);
                objects.push(cube.mesh);
                scene.add(cube_object);
            }
        }
    }
    var black_material = new THREE.MeshLambertMaterial( { color: 0x000000 } );
    var black_mesh = new THREE.Mesh(new THREE.CubeGeometry(300, 300, 300), black_material);
    black_mesh.position = new THREE.Vector3(0, 0, 0);
    scene.add(black_mesh);
}

