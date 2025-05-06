
export enum GamePlatform {
    YANDEX = 0,
    POKI = 1,
    CRAZYGAMES = 2,
    COOLMATHGAMES = 3,
    Y8 = 4,
    GAMEDISTRIBUTION = 5,
    FACEBOOK = 6,
    LOCAL = 7
}
export enum configurationPlatform {
    LOCAL =0,
    URL = 1,
   
}
const GameDefines = {
    GamePlatform: {
        YANDEX: 0, POKI: 1, CRAZYGAMES: 2, COOLMATHGAMES: 3, Y8: 4, GAMEDISTRIBUTION: 5, FACEBOOK: 6, LOCAL: 7
    },
    configDefines:{
        LOCAL :0,
        URL :1,
    }
};

export default GameDefines;