var walls = [
{
  id: 1,
  name : 'Brainstorming',
  description: 'meeting ',
  date: 'march',
  paper_ref: 1
},
{
  id: 2,
  name : 'Ideas',
  description: 'Just another meeting ',
  date: 'Feb',
  paper_ref: 2

}
];

module.exports.all = walls;

module.exports.find = function(id) {
  id = parseInt(id, 10);
  var found = null;
  wallloop: for(wall_index in walls) {
    var wall = walls[wall_index];
    if (wall.id == id) {
      found = wall;
      break wallloop;
    }    
  };
  return found;
}

module.exports.set = function(id, wall) {
  id = parseInt(id, 10);
  wall.id = id;
  walls[id - 1] = wall;
};

module.exports.new = function() {
  return {
	name : '',
	description: '',
	date: '',
	paper_ref: 0
  };
}

module.exports.insert = function(wall) {
  var id = walls.length + 1;
  wall.id = id;
  walls[id - 1] = wall;
  return id;
}