var condition = null;

function send_command(command, payload = {}) {
    var bottext = document.getElementById("bottext");
    var input = document.getElementById('autobot');

    payload.command = command;
    bottext.value = JSON.stringify(payload);
    if (input.checked)
	outSocket.send(JSON.stringify(payload));
}

function dobotcalc(data) {
        if (condition !== null) {
            if (condition(data)) {
                condition = null;
            } else {
                return;
            }
        }
    if (data.can_join == true) {
	send_command('join', {name: 'Heinz'})
    }
        if (data.state === 'ready') {
            if (data.dealer === 0) {
                send_command('deal'); // 'rotate_teams' to change pos
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
                let play = plays[Math.floor(Math.random() * plays.length)];
                let wish_rank = '7';
		//if ('1' in play) else null;
                send_command('play', {cards: play, wish_rank: wish_rank});
                if (play === '0' && data.players[3].hand_size === 0 && data.players[2].hand_size === 0) {
		    // played the dog to myself -> no condition
		    condition = null;
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
