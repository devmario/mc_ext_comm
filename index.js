var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;

var Tail = require('tail').Tail;
var jsonfile = require('jsonfile');
var zlib = require("zlib");
var NbtReader = require('node-nbt').NbtReader;

var lp = /\[([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})\]\s+\[([^\]]+)\]:\s+(.*?)$/i;
var cp = /<([^>]+)>\s+(.*?)$/i;

var tail = new Tail("../25565/logs/latest.log");

var tk = "@";
var comm = {};

function execRcon(msg) {
	try{console.log(execSync(`build/mcrcon -c -H 127.0.0.1 -P 25575 -p aq090909 \"${msg}\"`, {encoding:'utf8'}));}catch(err){}
}

function execRconOutput(who, msg) {
	execRcon(`/w ${who} ${msg}`);
}

function readPositionSync(name) {
	var users = jsonfile.readFileSync("../25565/usercache.json");
	var uuid = "";
	for(var i = 0, item; item = users[i]; i++) {
		if(item.name == name) {
			uuid = item.uuid;
			break;
		}
	}
	if(!uuid) return null;
	var nbtFile = `../25565/world/playerdata/${uuid}.dat`;
	var data = fs.readFileSync(nbtFile);
	var buf = zlib.gunzipSync(data);
	var d = NbtReader.readTag(buf);
	d = NbtReader.removeBufferKey(d);
	d = d.val;
	d = d.filter(function(it) {
		return it.name == "Pos";
	});
	d = d[0].val.list;
	var x = d[0].val,
	y = d[1].val,
	z = d[2].val;
	return {x:x, y:y, z:z};
}

function readJsonExist(name) {
	var fname = `data/${name}.json`;
	var data = {name: name, positions:{}};
	if(!fs.existsSync(fname)) fs.writeFileSync(fname, JSON.stringify(data));

	data = jsonfile.readFileSync(fname);
	return data;
}

comm[`${tk}help`] = comm[`${tk}?`] = function(data, args) {
	if(!data || !data.name) return;
	var output = 'It is available commands.\n@?, @help, @list, @list user, @save key, @go key, @go user key, @delete key';
	execRconOutput(data.name, output);
	return data;
};

comm[`${tk}list`] = function(data, args) {
	if(!data || !data.name) return;
	var originalName = data.name;
	if(args[1]) {
		data = readJsonExist(args[1]);
	}
	var output = Object.keys(data.positions).sort().join(", ");
	if(!args[1]) {
		if(!output) {
			output = "Not found positions.\nNeed '@save key' command at you want position.";
		} else {
			output = "Your positions list.\nIf you want teleport, Just call '@go key' command.\n[" + output + "]";
		}
	} else {
		if(!output) {
			output = `Not found ${args[1]} or ${args[1]}\'s positions list`;
		} else {
			output = `${args[1]}\'s positions List.\nIf you want teleport, Just call \'@go ${args[1]} key\' command.\n[` + output + "]";
		}
	}
	execRconOutput(originalName, output);
	return data;
};

comm[`${tk}save`] = function(data, args) {
	if(!data || !data.name) return;
	var output = 'Not found Key.(\'@save key\')';
	if(args[1]) {
		var key = args[1];
		execRcon('/save-all');

		var pos = readPositionSync(data.name);
		data.positions[args[1]] = pos;
		output = `Saved \'${key}\'.\nSave completed at current position.(x:${pos.x}, y:${pos.y}, z:${pos.z})`;  
	}
	execRconOutput(data.name, output);
	return data;
};

comm[`${tk}go`] = function(data, args) {
	if(!data || !data.name) return;
	var originalName = data.name;
	var output = 'Not found Key.(\'@go key\' or \'@go user key\')';
	var name;
	var key;
	if(args[1] && args[2]) {
		name = args[1];
		key = args[2];
		data = readJsonExist(name);
	} else if(args[1]) {
		key = args[1];
	}
	if(key) {
		if(data.positions[key] != undefined) {
			var pos = data.positions[key];
			execRcon(`/tp ${originalName} ${pos.x} ${pos.y} ${pos.z}`);
			if(name) {
				output = `Move completed.(\'@go ${name} ${key}\')`;
			} else {
				output = `Move completed.(\'@go ${key}\')`;
			}
		} else {
			if(name) {
				output = `Not found Key from @list ${name}.(\'@go ${name} key\')`;
			} else {
				output = 'Not found Key from @list.(\'@go key\')';
			}
		}
	}
	execRconOutput(originalName, output);
	return data;
};

comm[`${tk}delete`] = function(data, args) {
	if(!data || !data.name) return;
	var output = 'Not found Key.(\'@delete key\')';
	if(args[1]) {
		var key = args[1];
		if(!data.positions[key]) {
			output = 'Not found Key from @list.(\'@delete key\')';
		} else {
			delete data.positions[key];
			output = `Delete completed.(\'@delete ${key}\')`;
		}
	}
	execRconOutput(data.name, output);
	return data;
};

tail.on("line", function(line) {
	var lm = lp.exec(line);
	if(!Array.isArray(lm)) return;
	if(!lm[3]) { return; }
	var cm = cp.exec(lm[3]);
	if(!Array.isArray(cm)) return;
	if(!cm[1]) return;
	var name = cm[1];
	if(!cm[2]) return;
	var text = cm[2];

	var args = text.split(" ");
	if(!args[0]) return;
	var func = comm[args[0]];
	if(!func) return;

	var data = readJsonExist(name);
	data = func(data, args);
	jsonfile.writeFileSync(`data/${data.name}.json`, data);
});

tail.on("error", function(error) {
	console.log('ERROR: ', error);
});
