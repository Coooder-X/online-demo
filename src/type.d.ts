interface GameRoom {
    name: string;
    owner: Player;
    started: boolean;
    readyNum: number;
    message: Array;
    playerMap: Map<string, Player>; //  已改为 player.id, player 的键值对
}

interface GameRoomSerializ {
    name: string;
    owner: Player;
    started: boolean;
    readyNum: number;
    message: Array<Message>;
    playerLst: Player[];
}

interface Card {
    value: string;
    color: boolean; //  isBlack
    isShown: boolean;   // 是否翻牌可见
    playerId: string | null;   //   null 标识未被摸到，在牌堆里
}

interface CardPile {
    blackCards: Card[];
    whiteCards: Card[];
}

interface Message {
    playerName: string;
    msg: string;
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

interface GetCardReq {
    roomName: string | undefined;
    playerId: string | undefined;
    isBlack: boolean;
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

interface StartReq {
    roomName: string;
    isOwner: boolean;
    ready: boolean;
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