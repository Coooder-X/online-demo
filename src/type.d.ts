interface GameRoom {
    id: string;
    started: boolean;
    message: Map<string, string>;
    playerMap: Map<string, Player>;
}
interface Player {
    id: string;
    socketId: string;
}