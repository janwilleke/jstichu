//import {decodeCard} from './DecodeCard.js'

var outSocket //json connection to the tichu server

function startFunction() {
    var botsocket // anbindung an pythin - nur noch für den bot
    var player_id = "test"
    searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('player_id'))
	player_id = searchParams.get('player_id');
    console.log("option player:" + player_id);

    const height = window.innerHeight;
    const width = window.innerWidth;
    console.log(height, width); // 711 1440
    // horst und port als parameter wird auch mal interessanter
    outSocket = new WebSocket("ws://192.168.178.152:9292/connect?game_id=TESTI&player_id=" +
			      player_id);

    outSocket.onmessage = (event) => {
	parseincome(event.data);
	dobotcalc(JSON.parse(event.data));
    };

    var bottext = document.getElementById("bottext");
    $('form#rw').submit(function(event) {
	console.log("button" + $('#bottext').val());
	outSocket.send($('#bottext').val());
	return false;
    });
}

interact('.mycard').draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    modifiers: [
	interact.modifiers.restrictRect({
            endOnly: true
	})
    ],
    // enable autoScroll
    autoScroll: true,

    listeners: {
	move: dragMoveListener
    }
})
function totichuserver(cmd, addon={}) {
    addon.command = cmd;
    console.log("cmd to server" + JSON.stringify(addon));
    outSocket.send(JSON.stringify(addon));
}

interact('.dropzone').on('tap',function (event) {
    const collection = document.getElementsByClassName("in-drop");
    let s = "";
    if (document.getElementById("tisch-dropzone").innerHTML == "kein grosses tichu") {
	totichuserver("back6");
    } else if (document.getElementById("tisch-dropzone").innerHTML == "aufheben") {
	totichuserver("claim", {to_player: 0});
    } else if (document.getElementById("tisch-dropzone").innerHTML == "abgeben") {
	totichuserver("claim", {to_player: 1});
    } else {
	for (let i = 0; i < collection.length; i++) {
	    s = s + collection[i].getAttribute("cardcode");
	}
	cleanallelementsclass("in-drop");
	totichuserver("play", {cards: s, wish_rank: null});
    }
});

interact('.dropzone').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    ondragenter: function (event) {
	event.relatedTarget.classList.add('in-drop')
    },
    ondragleave: function (event) {
	event.relatedTarget.classList.remove('in-drop')
    },
})

interact('.player').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    ondragenter: function (event) {
	let boxid = event.target.id
	event.relatedTarget.classList.add('player-drop')
	event.relatedTarget.classList.add('player-' + boxid)
    },
    ondragleave: function (event) {
	let boxid = event.target.id
	event.relatedTarget.classList.remove('player-drop')
	event.relatedTarget.classList.remove('player-' + boxid)

    },
    ondrop: function (event) {
	const cl = document.getElementsByClassName("player-links");
	const cm = document.getElementsByClassName("player-mitte");
	const cr = document.getElementsByClassName("player-rechts");
	let s = "";
	if (cl.length == 1)
	    s = s + cl[0].getAttribute("cardcode");
	if (cm.length == 1)
	    s = s + cm[0].getAttribute("cardcode");
	if (cr.length == 1)
	    s = s + cr[0].getAttribute("cardcode");
	if (s.length == 3) {
	    totichuserver("pass_cards", {cards: s});
	    cl[0].remove();
	    cm[0].remove();
	    cr[0].remove();
	}
    },
})

function printcards(hand, y, extraclass = null) {
    for (let i = 0; i < hand.length; i++) {
	let ch = hand[i];
	let cardnum = ch.charCodeAt(0) - '0'.charCodeAt(0);
        let div;
	if (document.getElementById("card" + cardnum) || false) {
	    div = document.getElementById("card" + cardnum); // only move
	} else { // add the card
	    let cardcode = String.fromCharCode(cardnum + 0x30)
	    const { suit, rank, color_style } = decodeCard(cardnum)
	    div = document.createElement('div');
	    div.id = "card" + cardnum;
	    div.className = 'card';
	    div.setAttribute('cardcode', cardcode);
	    div.textContent = rank + " " + suit;
	    div.classList.add(color_style); // lockup inside css
	    document.body.appendChild(div);
	    if (extraclass != null)
		div.classList.add(extraclass);
	}
	div.style.transform = 'translate(' + (i * 45) + 'px, ' + y + 'px)';
	div.setAttribute('data-x', i * 45);
	div.setAttribute('data-y', y);
    }
}

function cleanallelementsclass(c) {
	const collection = document.getElementsByClassName(c);
	while (collection.length > 0) {
	    collection[0].remove();
	}
}

function parseincome(jdata) {
    let data = JSON.parse(jdata);
    let hand = data.players[0].hand;
    let lastplay = data.last_play || {cards: ""};
    let error = data.error || null;

    if (error)
	console.log(error);

    printcards(hand, 0, "mycard");
    if (lastplay.cards == "") {
	cleanallelementsclass("played0");
	cleanallelementsclass("played1");
	cleanallelementsclass("played2");
	cleanallelementsclass("played3");
    } else {
	if (lastplay.player == 3)
	    printcards(lastplay.cards, 150, "played3");
	if (lastplay.player == 2)
	    printcards(lastplay.cards, 200, "played2");
	if (lastplay.player == 1)
	    printcards(lastplay.cards, 250, "played1");
	if (lastplay.player == 0)
	    printcards(lastplay.cards, 100, "played0");
    }

    if (data.error) {
        console.log(data.error);
    }

    if (data.state === 'over') {
	document.getElementById("tisch-dropzone").innerHTML = "Spiel to ende";
    } else if (data.state === 'passing') {
	if (data.players[0].hand_size === 8) {
	    document.getElementById("tisch-dropzone").innerHTML = "kein grosses tichu";
	} else {
	    document.getElementById("tisch-dropzone").innerHTML = "schiebe phase";
	}
    } else if (data['trick_winner'] == 0) {
	if (data.dragon_trick)
	    document.getElementById("tisch-dropzone").innerHTML = "abgeben";
	else
	    document.getElementById("tisch-dropzone").innerHTML = "aufheben";
    } else {
	document.getElementById("tisch-dropzone").innerHTML = "legen";
    }
}

function dragMoveListener (event) {
    var target = event.target
    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    // translate the element
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

    // update the posiion attributes
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener
