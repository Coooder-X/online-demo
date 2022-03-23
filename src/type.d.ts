interface GameRoom {
    name: string;
    owner: Player;
    started: boolean;
    message: Map<string, string>;
    playerMap: Map<string, Player>; //  已改为 player.id, player 的键值对
}

interface CreateRoomReq {
    roomName: string;
    owner: Player | undefined;
}

interface JoinRoomReq {
    roomName: string;
    player: Player | undefined;
}

interface LaveRoomReq {
    player: Player;
    room: GameRoom;
}
interface Player {
    // avatar?: any;   //  头像
    name: string;
    id: string;
    socketId: string;
}

interface StartInfo {
    msg: string;
    enable: boolean;
}

interface JoinRoomRes {
    room?: GameRoom;
    msg: string;
    success: boolean;
}

interface CreateRoomRes {
    room?: GameRoom;
    msg: string;
    success: boolean;
}

interface RoomInfo {
    name: string;
    started: boolean;
    playerNum: number;
    owner: Player;
    playerLst: Player[];
}