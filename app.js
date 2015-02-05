$(document).ready(function() {
  
Physics(function(world){
  var viewWidth = 900;
  var viewHeight = 500;
   
  //variables used in functions below
  var scratch; //will be used for mouse movement tracking
  var newAngle; //the point that we are aiming at
  var mousePos; //where the mouse is located
  var cityCount=4; //amount of lives/cities to defend, when 0, game over
  
  //world objects

  var bullet; //will be created on mouseclicks
  var enemy; //created by mouse generator starting every 3 secs
  var currentScore=0; //player score

  // turret components
  var turretBase = Physics.body('rectangle', {
    x: 450,
    y: 480,
    width: 50,
    height: 30,
    treatment: 'static'
  });
  
  var cannon = Physics.body('rectangle', {
    x: 450,
    y: 440,
    width:25,
    height:10,
    treatment: 'static'
  });
  
  //four cities to defend
  var cityA = Physics.body('rectangle', {
    x: 100,
    y: 475,
    width:80,
    height:40,
    treatment: 'static'
  });
  
  var cityB = Physics.body('rectangle', {
    x: 265,
    y: 475,
    width: 80,
    height:40,
    treatment: 'static'
  });
  
  var cityC = Physics.body('rectangle', {
    x: 635,
    y: 475,
    width:80,
    height:40,
    treatment: 'static'
  });
  
  var cityD = Physics.body('rectangle', {
    x: 800,
    y: 475,
    width:80,
    height:40,
    treatment: 'static'
  });

  //renderer
  var renderer = Physics.renderer('canvas', {
    el: 'board',
    width: viewWidth,
    height: viewHeight,
    meta: false, // don't display meta data
    styles: {
        'convex-polygon' : {   //enemies
          fillStyle: '#26F51B'
        },
        'circle' : {     //bullets
          fillStyle: '#F70A0A'
        },
        'rectangle' : {     //cities and turret
          fillStyle: '#0000FF'
        }
    }
  });

  // add the renderer
  world.add( renderer );
  // render on each step
  world.on('step', function(){
    world.render();
  });

  // bounds of the window
  var viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);

  //add objects to the world
  world.add(turretBase);
  world.add(cannon);
  world.add(cityA);
  world.add(cityB);
  world.add(cityC);
  world.add(cityD);
  
  // ensure objects bounce when edge collision is detected
  //need to edit this so that objects are destroyed when collision is detected -TO DO
  world.add(Physics.behavior('body-impulse-response') );

  world.add(Physics.behavior('body-collision-detection'));

  world.add(Physics.behavior('sweep-prune') );

  // gravity (useful for enemy generation need to slow this down)
  var halfGravity = Physics.behavior('constant-acceleration', {
    acc: { x : 0, y: 0.0003 } // reduced from default of .0004
    });

  world.add(halfGravity);

  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function( time, dt ){
      world.step( time );
  });


  //targeting functionality for mouse movement
  
  document.getElementById("board").onmousemove = function(event){
    scratch = Physics.scratchpad();  //have to use this or it "blows up"
    mousePos = scratch.vector().set(event.pageX, event.pageY); //where are we pointing now
    scratch.done(); //throw out the scratchpaper
    mousePos.vsub(cannon.state.pos); //calulate the diff
    newAngle = mousePos.angle(); // get new angle with respect to x axis
    cannon.state.angular.pos = newAngle; //set to new angle
    };

  //listener to fire bullet on click
  document.getElementById('board').onclick = function(event) {
    world.emit('shot-fired');
    };

  // start the ticker
  Physics.util.ticker.start();

  
  //enemy generator
  var factory=window.setInterval( function(){
      enemy = Physics.body('convex-polygon', {
        x: Math.floor(Math.random() * (880 - 20)) + 20, //randomly generated enemy on x axis
        y: 100,
        // the centroid is automatically calculated and used to position the shape
        vertices: [
            { x: 0, y: -15 },
            { x: -15, y: -4 },
            { x: -9, y: 12 },
            { x: 9, y: 12 },
            { x: 15, y: -4 }
            ] 
        });
    if(cityCount!==0){
      world.add(enemy);
    }
    else {
      alert("Game Over");
      clearInterval(factory);
    }
  },2000);
  
  function scoring(){
      currentScore+=25; //increases score by 100 per enemy kill, needs to fix city issue
      document.getElementById('score').innerHTML="Score: " + currentScore;
  }

  //create a bullet onclick to fire where turret is aimed
  world.on('shot-fired', function(data, event) {
   //where are we aiming
   var angle = newAngle; //from where we are aiming, need to check incase moving?
   //where do we want to shoot, will need this for our bullets
   var cos = Math.cos( newAngle );
   var sin = Math.sin( newAngle );
   // add a "bullet at the turret location when shot-fired" 
   bullet = Physics.body('circle', {
      x: 450, // x-coordinate set at turret 
      y: 430, // y-coordinate set at turret
      radius: 10,
      treatment:'dynamic',    
      vx: cos, //cosine for x coordinate acceleration
      vy: sin//sine for y coordinate acceleration
      });
    world.add(bullet);   
    bullet.sleep(false);
  });

  
  //collision handling for cities, bullets, and enemies
  world.on('collisions:detected', function(data, event) {  
    //no bullets hitting cities
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityA) ||
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityA)){
        world.removeBody(bullet);
    }
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityB) || 
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityB)){
       world.removeBody(bullet);
    }
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityC) || 
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityC)){
       world.removeBody(bullet);
    }
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityD) || 
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityD)){
       world.removeBody(bullet);
    }   
    //bullets killing enemies
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) ||
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
        world.removeBody(bullet);
        world.removeBody(enemy);
        scoring(currentScore);
    }
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) || 
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
        world.removeBody(bullet);
        world.removeBody(enemy);
        scoring(currentScore);
    }
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) || 
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
        world.removeBody(bullet);
        world.removeBody(enemy);
        scoring(currentScore);
    }
    if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) || 
        (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
        world.removeBody(bullet);
        world.removeBody(enemy);
        scoring(currentScore);
    }    
    //enemy hitting a city
    if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityA) ||
        (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityA)){
        world.removeBody(enemy);
        world.removeBody(cityA);
        cityCount--;
    }
    if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityB) || 
        (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityB)){
        world.removeBody(enemy);
        world.removeBody(cityB);
        cityCount--;
    }
    if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityC) || 
        (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityC)){
        world.removeBody(enemy);
        world.removeBody(cityC);
        cityCount--;
    }
    if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityD) || 
        (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityD)){
        world.removeBody(enemy);
        world.removeBody(cityD);
        cityCount--;
    }
        //strange events aka, enemy hitting turret 
     if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cannon) || 
        (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cannon)){
        world.removeBody(enemy);
    }
     if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===turretBase) || 
        (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===turretBase)){
        world.removeBody(enemy);
    } 

  });


 });
});