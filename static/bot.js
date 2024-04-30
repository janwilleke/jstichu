var condition = null;

function send_command(command, payload = {}) {
    // Implement the logic to send a command
    var bottext = document.getElementById("bottext");
    payload.command = command;
    console.log(`jsbot payload: ${JSON.stringify(payload)}`);
    bottext.value = JSON.stringify(payload);
}

function dobotcalc(data) {
        console.log("<=<= received game state");
        console.log(data.players[0]);
        console.log(`state: ${data.state} turn ${data.turn}`);
        console.log(`fertig geschoben: ${!data.players[0].passed_cards}`);

        if (condition !== null) {
            console.log(condition(data));
        } else {
            console.log("condition is NULL");
        }
        console.log("--------------");

        if (data.state === 'over') {
            console.log("its all over baby blue");
            process.exit();
        }
        if (data.error) {
            console.log(data.error);
            process.exit();
        }

        if (condition !== null) {
            if (condition(data)) {
                condition = null;
            } else {
                console.log("...");
                return;
            }
        }

        if (data.state === 'ready') {
            if (data.dealer === 0) {
                send_command('deal');
                condition = (data) => data.state !== 'ready';
            }
        } else if (data.state === 'passing') {
            if (data.players[0].hand_size === 8) {
                send_command('back6');
                condition = (data) => data.players[0].hand_size === 14;
            } else if (!data.players[0].passed_cards) {
                send_command('pass_cards', {cards: data.players[0].hand.slice(0, 3)});
                condition = (data) => data.turn !== null;
            }
        } else if (data.state === 'playing') {
            if (data.turn === 0) {
                let plays = Object.keys(data.players[0].possible_plays);
                console.log(`possible plays ${plays}`);
                let play = plays[Math.floor(Math.random() * plays.length)];
                console.log(`possible play ${play}`);
                let wish_rank = '7';
		//if ('1' in play) else null;
                send_command('play', {cards: play, wish_rank: wish_rank});
                if (play === '0' && data.players[3].hand_size === 0 && data.players[2].hand_size === 0) {
                    console.log("played dog");
                } else {
                    condition = (data) => data.turn !== 0;
                }
            }
            if (data.turn === null && data.trick_winner === 0) {
                send_command('claim', {to_player: data.dragon_trick ? 1 : 0});
                condition = (data) => data.turn !== null;
            }
        }
    }
