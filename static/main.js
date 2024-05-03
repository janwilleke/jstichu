//import {decodeCard} from './DecodeCard.js'

var outSocket; //json connection to the tichu server

function startFunction() {
    var botsocket // anbindung an pythin - nur noch für den bot
    var player_id = null
    var game_id = null
    searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('player_id'))
	player_id = searchParams.get('player_id');
    if (searchParams.has('game_id'))
	game_id = searchParams.get('game_id');
    console.log("option player:" + player_id + "game:" + game_id);

    // horst und port als parameter wird auch mal interessanter
    var cns = "ws://192.168.178.152:9292/connect";
    if (game_id != null) {
	cns = cns + "?game_id=" + game_id + "&player_id=";
        if (player_id != null) cns = cns + player_id;
    }

    outSocket = new WebSocket(cns);
    console.log("after try to connect");
    outSocket.addEventListener('error', (event) => {
	console.log('WebSocket connection failed:', event);
	// wget -q -O - --post-data 'name=Peter&end_score=1000 ' http://localhost:9292/ne
	var url = "/new";
	fetch(url, {
	    method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: "Peter", end_score: 1000})
	}).then(response => response.json())
            .then(data => {
		console.log(data);
		window.location.href = "http://localhost:5000?game_id=" +
		    data.game_id + "&player_id=" + data.player_id;
	    })
            .catch(error => console.error('Error fetching data:', error));

    });


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

interact('.table').on('tap',function (event) {
    const collection = document.getElementsByClassName("on-table");
    let s = "";
    if (document.getElementById("todo").innerHTML == "Rest aufheben") {
	totichuserver("back6");
    } else if (document.getElementById("todo").innerHTML == "aufheben") {
	totichuserver("claim", {to_player: 0});
    } else if (document.getElementById("todo").innerHTML == "abgeben") {
	totichuserver("claim", {to_player: 1});
    } else {
	for (let i = 0; i < collection.length; i++) {
	    s = s + collection[i].getAttribute("cardcode");
	}
	cleanallelementsclass("on-table");
	totichuserver("play", {cards: s, wish_rank: null});
    }
});

interact('.table').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    ondragenter: function (event) {
	event.relatedTarget.classList.add('on-table')
    },
    ondragleave: function (event) {
	event.relatedTarget.classList.remove('on-table')
    },
})

interact('.player').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    ondragenter: function (event) {
	let boxid = event.target.id
	event.relatedTarget.classList.add('player-' + boxid)
    },
    ondragleave: function (event) {
	let boxid = event.target.id
	event.relatedTarget.classList.remove('player-' + boxid)
    },
    ondrop: function (event) {
	const cl = document.getElementsByClassName("player-links");
	const cm = document.getElementsByClassName("player-partner");
	const cr = document.getElementsByClassName("player-rechts");
	let s = "";
	if (cr.length == 1)
	    s = s + cr[0].getAttribute("cardcode");
	if (cm.length == 1)
	    s = s + cm[0].getAttribute("cardcode");
	if (cl.length == 1)
	    s = s + cl[0].getAttribute("cardcode");
	if (s.length == 3) {
	    totichuserver("pass_cards", {cards: s});
	    cl[0].remove();
	    cm[0].remove();
	    cr[0].remove();
	}
    },
})

function pressbutton(event){
    let buttonid = event.target.id
    console.log(buttonid);
    if (buttonid == "join") {
	var namefield = document.getElementById("namefield");
	totichuserver(event.target.id, {name: namefield.value});
    } else {
	totichuserver(event.target.id);
    }
}

function addbutton(into, name) {
    // Create the input element
    var inputElement = document.createElement('input');

    // Set the ID, type, and value of the input element
    inputElement.setAttribute('id', name);
    inputElement.setAttribute('type', 'button');
    inputElement.value = name;

    // Add the onclick event handler
    inputElement.addEventListener('click', pressbutton);

    // Append the input element to the body of the document
    document.getElementById(into).appendChild(inputElement);

}
function addtext(into, name) {
    var textele = document.createElement('input');
    textele.setAttribute("id", name);
    textele.setAttribute("size", "50");
    textele.setAttribute('type', 'text');

    document.getElementById(into).appendChild(textele);
}
function printcards(hand, into, y, extraclass = null, orient = "left") {
    let wd = document.getElementById(into).offsetWidth;
    let wh = document.getElementById(into).offsetHeight;
    const dx = window.innerWidth / 14.5;
    const count = hand.length;
    let offx;
    let offy
    if (orient == "left")
	offx = 0;
    else if (orient == "right")
	offx = wd - count * (dx + 1);
    else
	offx = (wd - count * (dx + 1)) / 2;
    if (y == 1) // y ==1 steht für 2. reihe
	offy = wh/2;

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

	div.style.transform = 'translate(' + (offx + i * dx) + 'px, ' + offy + 'px)';
	div.setAttribute('data-x', offx + i * dx);
	div.setAttribute('data-y', offy);
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

    if (data.player_id) {
	// refresh the url - to save the player_id - in case restart
	document.location.search = "game_id=" +
	    data.id + "&player_id=" + data.player_id;
    }

    if (data.can_join == true) {
	document.getElementById("todo").innerHTML = "please Join";
	addtext("mymenu", "namefield");

	addbutton("mymenu", "join");
	return
    }
    document.getElementById("mymenu").innerHTML = data.players[0].name + "<br>" +
	data.players[0].tichu + "<br>";
    if (data.state === 'ready') {
	addbutton("mymenu", "deal");
	addbutton("mymenu", "rotate_teams");
    }
    if (data.turn == 0 ) {
	document.getElementById("mymenu").style.backgroundColor = "#444444";
    } else {
	document.getElementById("mymenu").style.backgroundColor = "";
    }

    /* 1 und 3 ausgetauscht weil der server falsch rumspielt*/
    for (let i = data.players.length - 1; i > 0; i--) {
	let player = data.players[i];
        let position = "links"; //3
        if (i === 2) position = "partner";
        if (i === 1) position = "rechts";
	let ele = document.getElementById(position + "text");
        ele.innerHTML = `${position}<br>${player.name}<br>${player.hand_size}<br>${player.tichu}`;
    }

    printcards(hand, "mycards", 0, "mycard", "center");
    if (lastplay.cards == "") {
	cleanallelementsclass("played-self");
	cleanallelementsclass("played-links");
	cleanallelementsclass("played-partner");
	cleanallelementsclass("played-rechts");
    } else {
	if (lastplay.player == 1) /* 1 und 3 ausgetauscht weil der server falsch rumspielt*/
	    printcards(lastplay.cards, "tisch", 0, "played-rechts", "right");
	if (lastplay.player == 2)
	    printcards(lastplay.cards, "tisch", 0, "played-partner", "left");
	if (lastplay.player == 3)
	    printcards(lastplay.cards, "tisch", 1, "played-links", "left");
	if (lastplay.player == 0)
	    printcards(lastplay.cards, "tisch", 1, "played-self", "right");
    }

    if (data.error) {
        console.log(data.error);
    }
    if (data.players[0].can_gt)
	addbutton("mymenu", "grand_tichu");
    if (data.players[0].can_tichu)
	addbutton("mymenu", "tichu");

    if (data.state === 'over') {
	document.getElementById("todo").innerHTML = "Spiel to ende";
	addbutton("mymenu", "New Game");

    } else if (data.state === 'passing') {
	if (data.players[0].hand_size === 8) {
	    document.getElementById("todo").innerHTML = "Rest aufheben";

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
