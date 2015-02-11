$(document).ready(function() {

//player object, will be used when saving to local storage
function Player(person,score){
  this.person=person;
  this.score=score;
}

//show us the last player...if they exist
if(localStorage.getItem("lastPlayer")!==null){
  var compressed=localStorage.getItem("lastPlayer");
  var onTheBoard=JSON.parse(compressed);
    if(onTheBoard.person!=='null') //if they don't put in a name, no score keeping for them
    {
      $("#last_player").html("Last Player:"+onTheBoard.person+"<br>Last Score:"+onTheBoard.score);
    }
}

Physics(function(world){
  var viewWidth = 900;
  var viewHeight = 500;

  //variables used in functions below
  var scratch; //will be used for mouse movement tracking
  var newAngle; //the point that we are aiming at
  var mousePos; //where the mouse is located
  var cityCount=4; //amount of lives/cities to defend, when 0, game over
  var currentScore=0; //player score

  //world objects
  var bullet; //will be created on mouseclicks
  var enemy; //created by mouse generator starting every 3 secs
  
  // turret components
  var turretBase = Physics.body('rectangle', {
    x: 450,
    y: 480,
    width: 50,
    height: 30,
    treatment: 'static',
    labels: 'turret'
  });
  
  var cannon = Physics.body('rectangle', {
    x: 450,
    y: 440,
    width:25,
    height:10,
    treatment: 'static',
    labels:'turret'
  });

  // //city builder function works(would remove 66 to 96) to add cities but ruins hit detection
  // function cityBuilder(name,location) {

  //     var place = Physics.body('rectangle',{
  //     x: location,
  //     y: 475,
  //     width:80,
  //     height:40,
  //     treatment: 'static',
  //     labels:'city'
  //     });
  // }

  // cityBuilder("cityA",100);
  // cityBuilder("cityB",265);
  // cityBuilder("cityC",635);
  // cityBuilder("cityD",800);
  
  //four cities to defend

  var cityA = Physics.body('rectangle', {
    x: 100,
    y: 475,
    width:80,
    height:40,
    treatment: 'static',
    labels:'city'
  });
  
  var cityB = Physics.body('rectangle', {
    x: 265,
    y: 475,
    width: 80,
    height:40,
    treatment: 'static',
    labels:'city'
  });
  
  var cityC = Physics.body('rectangle', {
    x: 635,
    y: 475,
    width:80,
    height:40,
    treatment: 'static',
    labels:'city'
  });
  
  var cityD = Physics.body('rectangle', {
    x: 800,
    y: 475,
    width:80,
    height:40,
    treatment: 'static',
    labels:'city'
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
        'city' : {     //cities 
          fillStyle: '#0000FF'
        },
        'turret' : {  //why is this not working for the turret, don't understand
          fillStyle: '#E9F022'
        },
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
  world.add(Physics.behavior('body-impulse-response') );

  world.add(Physics.behavior('body-collision-detection'));

  world.add(Physics.behavior('sweep-prune') );

  // modified, 75% gravity from physics default, game was too hard otherwise 
  var halfGravity = Physics.behavior('constant-acceleration', {
    acc: { x : 0, y: 0.0003 } // reduced from default of .0004
  });

  world.add(halfGravity);

  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function( time, dt ){
    world.step( time );
  });

  //targeting functionality for mouse movement
  $("#board").mousemove(function(event){
    scratch = Physics.scratchpad();  //have to use this or it "blows up"
    mousePos = scratch.vector().set(event.pageX, event.pageY); //where are we pointing now
    scratch.done(); //throw out the scratchpaper
    mousePos.vsub(cannon.state.pos); //calulate the diff
    newAngle = mousePos.angle(); // get new angle with respect to x axis
    cannon.state.angular.pos = newAngle; //set to new angle
  });

  //listener to fire bullet on click
  $('#board').click(function(event) {
    world.emit('shot-fired');
  });

  // start the ticker
  Physics.util.ticker.start();

  //enemy generator and game over controls
  var factory=window.setInterval( function(){
    enemy = Physics.body('convex-polygon', {
        x: Math.floor(Math.random() * (880 - 20)) + 20, //randomly generated enemy on x axis
        y: 100,
        labels:'enemy',
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
      endOfGame(); //no more targets, no more enemy generation, lets add player object to local storage
      clearInterval(factory);
    }
  },2000);
  
  //scorekeeping function
  function scoring(){
      currentScore+=25; //increases score by 100 per enemy kill, but, that's because of the ifstatement problem
      $("#score").innerHTML="Score: " + currentScore;
    }

  //deletion function for collision detection
  function deletion(itemA,itemB){
    world.remove(itemA);
    world.remove(itemB);
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
      vy: sin,//sine for y coordinate acceleration
      labels:'bullet'
    });
   world.add(bullet);   
   bullet.sleep(false);
 });
  
  //recent score in local storage would like to add a scoring table later  
  function endOfGame(){
    var who=prompt("Game Over! What is your name: ");
    var what=currentScore;
    endPlayer=new Player(who,what);
    savedPlayer=JSON.stringify(endPlayer);
    localStorage.setItem("lastPlayer",savedPlayer);
  }

  //collision queries DO NOT WORK
  // var bulletHit = Physics.query({
  //   name: 'circle', // only circles,aka bullets
  //   });

  // var enemyHit = Physics.query({
  //   name: 'convex-polygon', // only circles,aka bullets
  //   });
  // //if bullet hits enemy
  // var bulletHitEnemy=Physics.query({
  //   labels:{$in:['circle', 'convex-polygon']}
  // });

  //if enemy hits city
  // var enemyHitCity=Physics.query({
  //   labels:{$in:['enemy', 'city']}
  // });

  //collision handling for cities, bullets, and enemies "the mess"
  world.on('collisions:detected', function(data, event) { 
       // if((enemyHitCity(data.collisions.bodyA))&&(enemyHitCity(datacollisions.bodyB))){
       //    deletion(data.collisions.bodyA,data.collisions.bodyB);
       //    cityCount--; TEST OF QUERY, NOT WORKING
       // }
  //no bullets hitting cities
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityA) ||
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityA)){
    deletion(bullet);
  }
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityB) || 
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityB)){
    deletion(bullet);
  }
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityC) || 
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityC)){
    deletion(bullet);
  }
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===cityD) || 
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===cityD)){
    deletion(bullet);
  }   
    //bullets killing enemies
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) ||
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
      deletion(bullet,enemy);
      scoring(currentScore);
  }
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) || 
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
    deletion(bullet,enemy);
    scoring(currentScore);
  }
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) || 
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
    deletion(bullet,enemy);
    scoring(currentScore);
  }
  if ((bullet === data.collisions[0].bodyA && data.collisions[0].bodyB===enemy) || 
  (bullet === data.collisions[0].bodyB && data.collisions[0].bodyA===enemy)){
    deletion(bullet,enemy);
    scoring(currentScore);
  }  
  // enemy hitting a city
  if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityA) ||
  (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityA)){
    deletion(enemy,cityA);
    cityCount--;
  }
  if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityB) || 
  (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityB)){
    deletion(enemy,cityB);
    cityCount--; 
  }
  if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityC) || 
  (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityC)){
    deletion(enemy,cityC);
    cityCount--;
  }
  if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cityD) || 
  (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cityD)){
    deletion(enemy,cityD);
    cityCount--;
  }
  //strange events aka, enemy hitting turret 
  if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===cannon) || 
  (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===cannon)){
    deletion(enemy);
  }
  if ((enemy === data.collisions[0].bodyA && data.collisions[0].bodyB===turretBase) || 
  (enemy === data.collisions[0].bodyB && data.collisions[0].bodyA===turretBase)){
    deletion(enemy);
  }    
  });

});  //close physics

});  //close doc ready load