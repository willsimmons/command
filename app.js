$(document).ready(function() {
  
Physics(function(world){
  var viewWidth = 900;
  var viewHeight = 500;

  var scratch; //will be used for mouse movement tracking
  var newAngle; //the point that we are aiming at

  var renderer = Physics.renderer('canvas', {
    el: 'board',
    width: viewWidth,
    height: viewHeight,
    meta: false, // don't display meta data
    styles: {
        // set colors for the cities, bullets, missles, and turret
        //FIGURE OUT HOW TO USE, CAN WE DO IN CSS MAIN?
        // 'bullets' : {
        //     strokeStyle: '#351024',
        //     lineWidth: 1,
        //     fillStyle: 'black',
        //     angleIndicator: '#351024'   //WHAT IS THIS PARAMETER
        // },
        // 'cities' : {     //large rectangles in the foreground
        //   fillStyle: '#ccc'
        // },
        // 'missles' : {     //small squares
        //   fillStyle: '#ccc'
        // },
        // 'turret' : {     //small squares
        //   fillStyle: '#ccc'
        // }
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

  // constrain objects to these bounds
  world.add(Physics.behavior('edge-collision-detection', {
      aabb: viewportBounds,
      restitution: 1,
      cof: 0
  }));

  // // add a "ball"   use this for bullet generation and missile
  // var ball = Physics.body('circle', {
  //   x: 250, // x-coordinate
  //   y: 480, // y-coordinate
  //   radius: 10
  // });

  // world.add(ball);

  // add the turretBase
  var turretBase = Physics.body('rectangle', {
    x: 450,
    y: 485,
    width: 50,
    height: 30,
    treatment: 'static'
  });
  
  var cannon = Physics.body('rectangle', {
    x: 450,
    y: 440,
    width:25,
    height:10,
    treatment: 'dynamic'
  });

  world.add(turretBase);
  world.add(cannon);
  // ensure objects bounce when edge collision is detected
  //need to edit this so that objects are destroyed when collision is detected?
  world.add( Physics.behavior('body-impulse-response') );

  world.add(Physics.behavior('body-collision-detection'));

  world.add(Physics.behavior('sweep-prune') );

  // add some gravity
  // world.add( Physics.behavior('constant-acceleration') );

  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function( time, dt ){
      world.step( time );
  });


//targeting functionality for mouse mousemovement
  
    document.getElementById("board").onmousemove = function(event){
    scratch = Physics.scratchpad();  //have to use this or it "blows up"
    mousePos = scratch.vector().set(event.pageX, event.pageY); //where are we pointing now
    scratch.done();   ///work out the math
    mousePos.vsub(cannon.state.pos); //calulate the
    newAngle = mousePos.angle(); // get angle with respect to x axis
    cannon.state.angular.pos = newAngle;
    
};

  // //listener to aim turret and to fire turret spaghetti than refine
  // window.addEventListener('mousemove', function(event) {
  //   console.log(event);
  //   // if (event.keyCode === 13) {
  //   //   world.emit('start-ball');
  //   // } else if (event.keyCode === 37) {
  //   //   world.emit('move', 'left');
  //   // } else if (event.keyCode == 39) {
  //   //   world.emit('move', 'right');
  //   // }
  // });

  // start the ticker
  Physics.util.ticker.start();

  //set a one function to fire when mouse clicked, generate a bullet ob at that angle...
  world.one('start-ball', function(data, e) {
    ball.state.vel.set(0.33,-0.33);
    ball.sleep(false);
  });

   //move turret cannon, see if we can find out where the mouse is at this point?
  world.on('move', function(data, e) {
    turretTop.state.pos.set(platform.state.pos.x + (data === 'left' ? -20 : 20), platform.state.pos.y);
  });

    //figure out how to delete missles when connected, how to delete cities on connect

  world.on('collisions:detected', function(data, e) {
    console.log(data);
  });

});
});