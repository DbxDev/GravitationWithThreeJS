var UA_KILOMETERS = 149598000;
var TWO_PI = 2 * Math.PI;
var animation = (function(){

    "use strict";
    
    var scene=new THREE.Scene(),
        ambiant_light = new THREE.AmbientLight(0x404040),
        renderer,
        camera,
        renderer = new THREE.WebGLRenderer(),
        box, childBox,
        ground,
        clickable_objects = {},
        controls,
        earth,
        trajectory,
        last_frame = (new Date()).getTime(),
        controls=null;

        function initScene(){
            // initMouse();

            renderer.shadowMapEnabled = true;
            renderer.shadowMapSoft = true;
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById("my_canvas").appendChild(renderer.domElement);

            // var light = new THREE.DirectionalLight(0xffffff);
            // light.position.set(-30,0,0);
            // light.target.position.set(0,0,0);

            // light.castShadow = true;
            // light.shadowDarkness = 0.5; // 0 = no shadow, 1 = pure black
            // light.shadowCameraVisible = true; // Debug            
            // light.shadowCameraNear = 0;
            // light.shadowCameraFar = 60;

            // light.shadowCameraLeft = -30;
            // light.shadowCameraRight = 30;
            // light.shadowCameraTop = 30;
            // light.shadowCameraBottom = -30;

            // var light_helper = new THREE.DirectionalLightHelper(light, 30);
            // scene.add(light_helper);
            scene.add(ambiant_light);   
            camera = new THREE.PerspectiveCamera(
                    35,
                    window.innerWidth / window.innerHeight,
                    1,
                    1000
                );
            camera.position.set(0,0,5);
            camera.lookAt(new THREE.Vector3(0,0,0));

            scene.add(camera);
            controls = new THREE.OrbitControls( camera, renderer.domElement );
            initSun();
            initEarth();            

            // // Cube
            // var cube_geo = new THREE.BoxGeometry(5,5,5);
            // var cube_mat = new THREE.MeshLambertMaterial();
            // var cube = new THREE.Mesh(cube_geo, cube_mat);
            // cube.castShadow = true;
            // cube.rotation.x += Math.PI/6.0;
            // cube.rotation.y += Math.PI/6.0;
            // cube.rotation.z += Math.PI/6.0;
            // cube.position.y = 20;
            // scene.add(cube);

            // var plane_geo = new THREE.PlaneGeometry(150, 150);
            // var plane_mat = new THREE.MeshPhongMaterial({color: 0xcccccc});
            // var plane = new THREE.Mesh(plane_geo, plane_mat);
            // plane.position.set(15, 0, 0);
            // plane.rotation.z += Math.PI;
            // plane.rotation.y += 3.0*Math.PI/2.0;
            // plane.receiveShadow = true;
            // scene.add(plane);
            
            // var scale_factor = 0;
            // var dscale = 0.01;
            // setInterval(function(){
            //     box.rotation.y += unitMove;
            //     box.rotation.z += -unitMove;
            //     box.rotation.x += 1.5*unitMove;
            //     console.log("Scale ", scale_factor, " dscale ", dscale);
            //     if(scale_factor + dscale > 1 || scale_factor + dscale < -0.5)
            //         dscale = -dscale;
            //     scale_factor += dscale;
            //     box.scale.set(1+scale_factor, 1+scale_factor, 1+scale_factor);
            // }, 15);
            clickable_objects = [box];
            requestAnimationFrame(render);
        };
        function initSun(){
            var radius = 0.2;
            var segments = 64;
            var sun_geo = new THREE.SphereGeometry(radius, segments, segments);
            var sun_mat = new THREE.MeshBasicMaterial({color: 0xf4ff28});
            var the_sun = new THREE.Mesh(sun_geo, sun_mat);
            scene.add(the_sun);
            var light = new THREE.PointLight(0xffffff, 1, 0);
            scene.add(light);
        }
        function initEarth(){
            earth = new Earth();
            earth.initScene(scene);
        }
        function initMouse(){
            mouse = new THREE.Vector2();
            window.addEventListener('mousemove', onMouseMove, false);
            window.addEventListener('mousedown', onDocumentMouseDown, false);
        }
        // Normalized coordinates from -1 to +1
        function onMouseMove(event){
            mouse.x = ( (event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width ) * 2 - 1;
            mouse.y = - ( (event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height ) * 2 + 1;
        }
        function animation(){
            controls.update();
            var start = (new Date()).getTime(); 
            var dt = start - last_frame;
            if(dt > 0){
                earth.updatePosition(dt);
            }
            return start;
        }

        function render() {
            requestAnimationFrame(render);
            var start = animation();
            renderer.render(scene, camera);
            if(last_frame < start)
                last_frame = start;
            // else
                // console.log('Frame inversion ?');
        };
        function onDocumentMouseDown(event){
            event.preventDefault();
            console.log('Clic clic ' + mouse);
        };
       
        window.onload = initScene;
})();

function Trajectory(size){
    if(!size > 0)
        size = 100;
    this.size = size;
    this.lastIndex = 0;
    this.positions = new Array(size);
    var mat = new THREE.MeshBasicMaterial();
    var geo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    for(i=0; i < size; i++){
        this.positions[i] = new THREE.Mesh(geo, mat);
    };

    this.initScene = function(scene){
        for(i=0; i < size; i++){
            scene.add(this.positions[i]);
        }
    };
    this.move = function(position){
        var current = this.positions[this.lastIndex];
        current.position.set(position.x, position.y, position.z);
        this.lastIndex++;
        if(this.lastIndex == this.size)
            this.lastIndex = 0;
    };
}
function Earth(){
    this.coordinates = new THREE.Vector3(0,0,0);
    this.theta = 0;
    this.vtheta = -1;
    this.dist_sun = 1.5;

    /* Graphics */
    this.radius = 0.2;
    var segments = 32;
    var earth_geo = new THREE.SphereGeometry(this.radius, segments, segments);
    var earth_mat = new THREE.MeshLambertMaterial({color: 0x0000ff});
    this.graphic = new THREE.Mesh(earth_geo, earth_mat);
    this.graphic.position.x = 1;
    this.graphic.receiveShadow = true;
    this.graphic.castShadow = true;

    /* Child elements */
    this.trajectory = new Trajectory(250);
    this.moon = new Moon(this);
    this.initScene = function(scene){
        scene.add(this.graphic);
        this.trajectory.initScene(scene);
        this.moon.initScene(scene);
    }
    this.updatePosition = function(dt){
        this.updateCarthesian(dt);
        this.updateGraphic();
        this.trajectory.move(this.coordinates);
        this.moon.updatePosition(dt);
    }
    this.updateCarthesian = function(dt){
        this.theta += ( this.vtheta * dt/1000 );
        if(Math.abs(this.theta) > TWO_PI)
            this.theta -= Math.floor(this.theta / TWO_PI) * TWO_PI
        this.coordinates.x = this.dist_sun * Math.cos(this.theta);
        this.coordinates.y = this.dist_sun * Math.sin(this.theta);
    }
    this.updateGraphic = function(){
        this.graphic.position.x = this.coordinates.x;
        this.graphic.position.y = this.coordinates.y;
        this.graphic.position.z = this.coordinates.z;
    }
}
function Moon(planet){
    this.coordinates = new THREE.Vector3(0,0,0);
    this.theta = 0;
    this.dist_earth = 0.5;
    this.vtheta = -5.4;
    this.trajectory = new Trajectory(250);
    this.radius = 0.15;
    var segments = 32;
    var moon_geo = new THREE.SphereGeometry(this.radius, segments, segments);
    var moon_mat = new THREE.MeshLambertMaterial({color: 0x404040});
    this.graphic = new THREE.Mesh(moon_geo, moon_mat);
    this.graphic.receiveShadow = true;
    this.graphic.castShadow = true;
    this.graphic.name = 'moon';
    planet.graphic.add(this.graphic);
    planet.graphic.getObjectByName('moon').position.set(1,0,0.2);
    this.initScene = function(scene){
        this.trajectory.initScene(scene);
        // scene.add(this.graphic);
    }
    this.updatePosition = function(dt){
        this.updateCarthesian(dt);
        this.updateGraphic();
        var abs_position = new THREE.Vector3();
        abs_position.setFromMatrixPosition(this.graphic.matrixWorld);
        this.trajectory.move(abs_position);
    }
    this.updateCarthesian = function(dt){
        this.theta += ( this.vtheta * dt/1000 );
        if(Math.abs(this.theta) > TWO_PI)
            this.theta -= Math.floor(this.theta / TWO_PI) * TWO_PI
        this.coordinates.x = this.dist_earth * Math.cos(this.theta);
        this.coordinates.y = this.dist_earth * Math.sin(this.theta);
    }
    this.updateGraphic = function(){
        this.graphic.position.x = this.coordinates.x;
        this.graphic.position.y = this.coordinates.y;
        this.graphic.position.z = this.coordinates.z;
    }
}