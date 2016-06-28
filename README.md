# mc_ext_comm
Minecraft extensional command. rcon, nodejs, nbt.

this node.js script page is for minecraft teleport more smart.

## feature
- save current position with key
- teleport at saved key
- show key list
- delete key
- show another player's key list
- teleport at saved another player's key


### install
```
git submodule init
git submodule update
npm install
```

### config
minecraft server.properties
```
enable-rcon=true
rcon.port=PORT
rcon.password=PASSWORD
```
.env config
```
MCRCON_HOST=RCON_IP
MCRCON_PORT=RCON_PORT
MCRCON_PASSWORD=RCON_PASSWORD
MC_PATH=MINECRAFT_PATH
```

### run
```
node index.js
```

### command
```
@list
@list userName
@save positionKey
@go positionKey
@go userName positionKey
@?
@help
@delete positionKey
```
