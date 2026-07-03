const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const readline = require('readline');

const config = {
    host: 'khaidz1203-HzpN.aternos.me', 
    port: 46719,                         
    username: 'BotAFK24h',               
    version: false                       
};

const ADMIN_NAME = 'qkhai'; 

let bot;
let isManuallyOut = false; 
let rl; 

function createBot() {
    isManuallyOut = false; 
    bot = mineflayer.createBot(config);

    bot.loadPlugin(pathfinder);

    let botReady = false;

    bot.on('spawn', () => {
        console.log(`[Bot 1] ${bot.username} đã online! BẬT Ô CHAT TERMUX...`);
        console.log(`[Termux] Bạn có thể gõ nội dung vào đây rồi ấn Enter để bot nói vào game:`);
        
        setupTermuxChat();

        const mcData = require('minecraft-data')(bot.version);
        const movements = new Movements(bot, mcData);
        bot.pathfinder.setMovements(movements);

        setTimeout(() => {
            botReady = true;
        }, 5000);
    });

    bot.on('death', () => {
        console.log(`[Bot 1] Ôi không, bot đã bị chết! Đang tự động hồi sinh...`);
        bot.respawn(); 
    });

    // 1. XỬ LÝ LỆNH CHAT TRONG GAME + XEM LIVE CHAT
    bot.on('chat', (username, message) => {
        // DÒNG THÊM MỚI: In toàn bộ cuộc trò chuyện trong game lên màn hình Termux
        console.log(`[LIVE CHAT] ${username}: ${message}`);

        if (username === ADMIN_NAME) {
            if (message === 'bot.noi1') bot.chat('Phu gay');
            if (message === 'bot.noi2') bot.chat('Khai dep trai');
        }

        if (message === 'tambietbot') {
            bot.chat(`Tam biet ${username}`);
        }

        if (message === 'botout') {
            bot.chat('Toi se out server 5 phut de cac ban ngu nhe! Tam biet.');
            isManuallyOut = true; 
            if (rl) rl.close(); 
            bot.quit();
            
            console.log(`[Bot 1] Bị kick bởi ${username}. Sẽ vào lại sau 5 phút...`);
            
            setTimeout(() => {
                console.log('[Bot 1] Đã hết 5 phút, đang tự động kết nối lại...');
                createBot();
            }, 300000);
        }
    });

    // 2. TỰ ĐỘNG CHÀO SAU KHI NGƯỜI CHƠI VÀO GAME 30 GIÂY
    bot.on('playerJoined', (player) => {
        if (botReady && player.username !== bot.username) {
            console.log(`[Bot 1] Phát hiện ${player.username} vào sv. Sẽ chào sau 30 giây...`);
            setTimeout(() => {
                if (bot.players[player.username]) {
                    bot.chat(`Chao mung de vuong ${player.username} ve nha`);
                }
            }, 30000); 
        }
    });

    // 3. TỰ ĐỘNG TÌM GIƯỜNG VÀ ĐI NGỦ KHI TRỜI TỐI
    bot.on('time', () => {
        if (bot.time.timeOfDay >= 12500 && bot.time.timeOfDay <= 23000 && !bot.isSleeping) {
            const mcData = require('minecraft-data')(bot.version);
            const bedBlock = bot.findBlock({
                matching: (block) => mcData.blocksByName[block.name]?.isBed,
                maxDistance: 10
            });

            if (bedBlock) {
                bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
                const checkArrival = setInterval(async () => {
                    const distance = bot.entity.position.distanceTo(bedBlock.position);
                    if (distance <= 2) {
                        clearInterval(checkArrival);
                        try {
                            await bot.sleep(bedBlock);
                            bot.chat('Toi di ngu day, chuc moi nguoi ngu ngon!');
                        } catch (err) {
                            console.log(`[Bot 1] Không thể ngủ: ${err.message}`);
                        }
                    }
                }, 1000);
            }
        }
    });

    bot.on('wake', () => {
        bot.chat('Troi sang roi, thuc day thoi!');
    });

    // 4. XỬ LÝ KHI MẤT KẾT NỐI
    bot.on('end', (reason) => {
        if (rl) rl.close(); 
        if (isManuallyOut) return; 
        console.log(`[Bot 1] Mất kết nối do: ${reason}. Đang vào lại sau 10 giây...`);
        setTimeout(createBot, 10000); 
    });

    bot.on('error', (err) => console.error('[Lỗi Bot 1]:', err));

    // CHỐNG AFK CLICK VUNG TAY
    setInterval(() => {
        if (bot && bot.entity && !bot.isSleeping) {
            bot.swingArm('right'); 
            console.log('[Bot 1] Đã click vung tay chống AFK.');
        }
    }, 180000); 
}

// CHÁT TỪ TERMUX VÀO GAME
function setupTermuxChat() {
    if (rl) rl.close(); 
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (line) => {
        let input = line.trim();
        if (input.length > 0 && bot && bot.entity) {
            bot.chat(input); 
            console.log(`[Bạn -> Game]: ${input}`);
        }
    });
}

createBot();
