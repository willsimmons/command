$(document).ready(function() {
  
Physics(function(world){
  var viewWidth = 850;
  var viewHeight = 500;

  var scratch; //will be used for mouse movement tracking
  var newAngle; //the point that we are aiming at
  var mousePos; //where the mouse is located
 

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

  // add a "bullet at the turret location when shot-fired" 
  var bullet = Physics.body('circle', {
    x: 450, // x-coordinate 
    y: 440, // y-coordinate
    radius: 10
  });

  // world.add(ball);

  // add the turretBase
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
    y: 455,
    width:80,
    height:40,
    treatment: 'static'
  });
  
  var cityB = Physics.body('rectangle', {
    x: 265,
    y: 455,
    width: 80,
    height:40,
    treatment: 'static'
  });
  
  var cityC = Physics.body('rectangle', {
    x: 635,
    y: 455,
    width:80,
    height:40,
    treatment: 'static'
  });
  
  var cityD = Physics.body('rectangle', {
    x: 800,
    y: 455,
    width:80,
    height:40,
    treatment: 'static'
  });

  // //city constructor ask for help if we get to this on thursday
  // var City = function(x){
  //   self=this;
  //   this.type="rectangle";
  //   this.x=x;
  //   this.y=300;
  //   this.width=300;
  //   this.height=150;
  //   this.treatment="static";
  //   Physics.body(self.type,self.x,self.y,self.width,self.height,self.treatment);
  // };
  
  // var cityA= new City(200);
  // var cityB= new City(400);
  // var cityC= new City(600);
  // var cityD= new City(800);
    


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

  // add some gravity -TO DO (YES OR NO)
  world.add( Physics.behavior('constant-acceleration') );

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
    console.log(event);
    world.emit('shot-fired');
    };

  // start the ticker
  Physics.util.ticker.start();

  //set the function create a bullet on click aimed at where the turret is targeting
  //how to fire -TO DO
  world.on('shot-fired', function(data, e) {
    world.add(bullet);
    bullet.state.angle.pos = newAngle; //aiming at the same angle as the turret
    bullet.state.vel.set(0.33,-0.33);  //need to figure out how to shoot
    bullet.sleep(false);
  });

  

  //figure out how to delete missles when connected, how to delete cities on connect

  world.on('collisions:detected', function(data, e) {
    console.log(data);
  });

});
});