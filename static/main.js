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
    if (document.getElementById("todo").innerHTML == "kein grosses tichu") {
	totichuserver("back6");
    } else if (document.getElementById("todo").innerHTML == "aufheben") {
	totichuserver("claim", {to_player: 0});
    } else if (document.getElementById("todo").innerHTML == "abgeben") {
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

function printcards(hand, into, y, extraclass = null, orient = "left") {
    let wd = document.getElementById(into).offsetWidth;
    let wh = document.getElementById(into).offsetHeight;
    const dx = window.innerWidth / 14.5;
    const count = hand.length;
    let offx;

    if (orient == "left")
	offx = 0;
    else if (orient == "right")
	offx = wd - count * (dx + 1);
    else
	offx = (wd - count * (dx + 1)) / 2;
    if (y == 1)
	y = wh/2;

    for (let i = 0; i < count; i++) {
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
	    document.getElementById(into).appendChild(div);
	    if (extraclass != null)
		div.classList.add(extraclass);
	}

	div.style.transform = 'translate(' + (offx + i * dx) + 'px, ' + y + 'px)';
	div.setAttribute('data-x', offx + i * dx);
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
    if (data.turn == 0 ) {
	document.getElementById("mymenu").style.backgroundColor = "#444444";
    }
    else {
	document.getElementById("mymenu").style.backgroundColor = "";
    }
    document.getElementById("mymenu").innerHTML = data.players[0].name;

    /* 1 und 3 ausgetauscht weil der server falsch rumspielt*/
    document.getElementById("linkstext").innerHTML = "links<br>"   + data.players[3].name + "<br>" + data.players[3].hand_size;
    document.getElementById("mittetext").innerHTML = "mitte<br>"   + data.players[2].name + "<br>" + data.players[2].hand_size;
    document.getElementById("rechtstext").innerHTML = "rechts<br>" + data.players[1].name + "<br>" + data.players[1].hand_size;
    console.log(data.turn);



    printcards(hand, "mycards", 0, "mycard", "center");
    if (lastplay.cards == "") {
	cleanallelementsclass("played0");
	cleanallelementsclass("played1");
	cleanallelementsclass("played2");
	cleanallelementsclass("played3");
    } else {
	if (lastplay.player == 1) /* 1 und 3 ausgetauscht weil der server falsch rumspielt*/
	    printcards(lastplay.cards, "tisch", 0, "played3", "right");
	if (lastplay.player == 2)
	    printcards(lastplay.cards, "tisch", 0, "played2", "left");
	if (lastplay.player == 3)
	    printcards(lastplay.cards, "tisch", 1, "played1", "left");
	if (lastplay.player == 0)
	    printcards(lastplay.cards, "tisch", 1, "played0", "right");
    }

    if (data.error) {
        console.log(data.error);
    }

    if (data.state === 'over') {
	document.getElementById("todo").innerHTML = "Spiel to ende";
    } else if (data.state === 'passing') {
	if (data.players[0].hand_size === 8) {
	    document.getElementById("todo").innerHTML = "kein grosses tichu";
	} else {
	    document.getElementById("todo").innerHTML = "schiebe phase";
	}
    } else if (data['trick_winner'] == 0) {
	if (data.dragon_trick)
	    document.getElementById("todo").innerHTML = "abgeben";
	else
	    document.getElementById("todo").innerHTML = "aufheben";
    } else {
	document.getElementById("todo").innerHTML = "legen";
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
