var outSocket; //json connection to the tichu server

function asknewgame(name="") {
    console.log("ask for new");
    addtext("todo", "namefield");
    var namefield = document.getElementById("namefield");
    namefield.value = name;
    addbutton("todo", "Start Game", getnewgame);
    addbutton("todo", "Game-code", usegamecode);
}

function startFunction() {
    if (window.location.hash) {
	var hash = window.location.hash.substring(1); // Removes the '#' character
	params = hash.split(':');
	console.log("option player:" + params[1] + "game:" + params[0]);
	connectws(params[0], params[1])
    } else {
	asknewgame();
    }
}
function usegamecode() {
    var namefield = document.getElementById("namefield");

    connectws(namefield.value, null);
}

function getnewgame() {
    var namefield = document.getElementById("namefield");
    var url = "/new?name=" + namefield.value + "&end_score=1000";

    fetch(url, {method: 'POST'}).then(response => response.json())
        .then(data => {
	    // update url for refresh by user
	    window.location.href = "index.html#" +
		data.game_id + ":" + data.player_id;
	    console.log("got new");
	    connectws(data.game_id, data.player_id)
	})
        .catch(error => console.error('Error fetching data:', error));
}

function connectws(game_id, player_id) {
    var cns = `${location.origin.replace(/^http/, 'ws')}/connect`;

    cns = cns + "?game_id=" + game_id + "&player_id=";
    if (player_id != null) cns = cns + player_id;
    console.log("ws url: " + cns);
    outSocket = new WebSocket(cns);
    console.log("ws connected");

    outSocket.onmessage = (event) => {
	parseincome(event.data);
	dobotcalc(JSON.parse(event.data));
    };
    // only if connected we can use a bot
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
    modifiers: [interact.modifiers.restrictRect({restriction: 'parent'})],
    listeners: {move: dragMoveListener}
})

function totichuserver(cmd, addon={}) {
    addon.command = cmd;
    console.log("cmd to server" + JSON.stringify(addon));
    outSocket.send(JSON.stringify(addon));
}

function playwhatsonthetable(wish=null) {
    const collection = document.getElementsByClassName("on-table");
    let s = "";
    for (let i = 0; i < collection.length; i++) {
	s = s + collection[i].getAttribute("cardcode");
    }
    cleanallelementsclass("on-table");
    totichuserver("play", {cards: s, wish_rank: wish});
}

interact('.table').on('tap',function (event) {
    if (document.getElementById("todo").innerHTML == "Rest aufheben") {
	totichuserver("back6");
    } else if (document.getElementById("todo").innerHTML == "aufheben") {
	totichuserver("claim", {to_player: 0});
    } else if (document.getElementById("todo").innerHTML == "legen"){
	const collection = document.getElementsByClassName("wishbutton")
	if (collection.length == 0) /* der einer zug muss über wünschen gelegt werden */
	    playwhatsonthetable();
    } else if (document.getElementById("todo").innerHTML == "bomben") {
	playwhatsonthetable();
    } else {
	console.log("dont know what todo");
    }
});

function wishbutton(event){
    let buttonid = event.target.id

    if (buttonid == "-")
	playwhatsonthetable(null);
    else
	playwhatsonthetable(buttonid);
    cleanallelementsclass("wishbutton");
}

function abgebbutton(event){
    if (event.target.id == "links")
	totichuserver("claim", {to_player: 3});
    else
	totichuserver("claim", {to_player: 1});
}

interact('.table').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    ondragenter: function (event) {
	event.relatedTarget.classList.add('on-table');
	if (event.relatedTarget.id == "card1") {
	    const wishTypes = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'Q', 'K', '-'];
	    for (let i = 0; i < wishTypes.length; i++)
		addbutton("wish", wishTypes[i], wishbutton, "wishbutton");
	}
    },
    ondragleave: function (event) {
	event.relatedTarget.classList.remove('on-table');
	if (event.relatedTarget.id == "card1") {
	    cleanallelementsclass("wishbutton");
	}
    },
})

interact('.player').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    ondragenter: function (event) {
	event.relatedTarget.classList.add('player-' + event.target.id);
    },
    ondragleave: function (event) {
	event.relatedTarget.classList.remove('player-' + event.target.id);
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
    if (event.target.id == "join") {
	var namefield = document.getElementById("namefield");
	totichuserver(event.target.id, {name: namefield.value});
    } else {
	totichuserver(event.target.id);
    }
}

function addbutton(into, name, func=pressbutton, cl=null) {
    // Create a input element to call func on click
    var inputElement = document.createElement('input');

    inputElement.setAttribute('id', name);
    inputElement.setAttribute('type', 'button');
    inputElement.value = name;
    if (cl != null)
	inputElement.classList.add(cl);
    inputElement.addEventListener('click', func);
    document.getElementById(into).appendChild(inputElement);
}

function addtext(into, name) { /* needed only for the name */
    var textele = document.createElement('input');

    textele.setAttribute("id", name);
    textele.setAttribute("size", "50");
    textele.setAttribute('type', 'text');

    document.getElementById(into).appendChild(textele);
}
function printcards(hand, into, intomaster, y, extraclass = null, orient = "left", offy=0) {
    let wd = document.getElementById(into).offsetWidth;
    let wh = document.getElementById(into).offsetHeight;
    let dx = window.innerWidth / 14.5;
    const count = hand.length;
    let offx;

    if (wd < dx * count) {
	/* scheise zu viele karten für zu wennig platz */
	dx = wd / (count + 1);
    }
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
	let move = false;
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
	    document.getElementById(intomaster).appendChild(div);
	    if (extraclass != null)
		div.classList.add(extraclass);
	    move = true;
	}
	/* scheis trick wenn der user die karte schon bewegt hat
	   dann wird sie nicht auto bewegt */
	if (move || div.getAttribute('data-y') == offy) {
	    div.style.transform = 'translate(' + (offx + i * dx) + 'px, ' + offy + 'px)';
	    div.setAttribute('data-x', offx + i * dx);
	    div.setAttribute('data-y', offy);
	}
    }
}

function addclasstocard(card, classname) {
    let cardnum = card.charCodeAt(0) - '0'.charCodeAt(0);

    if (document.getElementById("card" + cardnum) || false) {
	document.getElementById("card" + cardnum).classList.add(classname);
    }
}

function cleanallelementsclass(c) {
	const collection = document.getElementsByClassName(c);
	while (collection.length > 0) {
	    collection[0].remove();
	}
}

function printcardsforplayer(player, cards) {
	if (player == 1) /* 1 und 3 ausgetauscht weil der server falsch rumspielt*/
	    printcards(cards, "tisch", "tisch", 0, "played-rechts", "right");
	if (player == 2)
	    printcards(cards, "tisch", "tisch", 0, "played-partner", "left");
	if (player == 3)
	    printcards(cards, "tisch", "tisch", 1, "played-links", "left");
	if (player == 0)
	    printcards(cards, "tisch", "tisch", 1, "played-self", "right");
}

function parseincome(jdata) {
    let data = JSON.parse(jdata);
    let hand = data.players[0].hand;
    let lastplay = data.last_play || {cards: ""};
    let error = data.error || null;
    let lastlogele = data.log.slice(-1)[0];
    let lastlogele2 = data.log.slice(-2)[0];

    if (data.player_id) {
	// refresh the url - to save the player_id - in case restart
	window.location.href = "index.html#" +
	    data.id + ":" + data.player_id;
    }

    if (data.can_join == true) {
	document.getElementById("todo").innerHTML = "please Join";
	if ($('#namefield').length == 0) {
	    addtext("mymenu", "namefield");
	    addbutton("mymenu", "join");
	}
	return
    }
    document.getElementById("mymenu").innerHTML = data.players[0].name + "<br>" +
	data.players[0].tichu + "<br>";
    if (data.state === 'ready' && data.dealer === 0) {
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
    if (data.state == 'passing' && data.players[0].hand_size === 8) {
	/* manchmal bleiben die alten karten hängen - hier kommt alles weg*/
	cleanallelementsclass("card");
    }
    printcards(hand, "mycards", "alles", 0, "mycard", "center",
	       offy = document.getElementById("tisch").offsetHeight);

    if (lastlogele != null && (lastlogele.cards == "0")) {
	printcardsforplayer(lastlogele.pi, lastlogele.cards); //extra hund print per log
    } else if (lastplay.cards == "") {
	cleanallelementsclass("played-self");
	cleanallelementsclass("played-links");
	cleanallelementsclass("played-partner");
	cleanallelementsclass("played-rechts");
    } else {
	printcardsforplayer(lastplay.player, lastplay.cards);
    }

    if (data.error) {
        console.log(data.error);
    }
    if (data.players[0].can_gt)
	addbutton("mymenu", "grand_tichu");
    if (data.players[0].can_tichu)
	addbutton("mymenu", "tichu");

    if (data["wish_rank"] != null && data["wish_rank"] != "") {
	document.getElementById("wish").innerHTML = "wunsch: " + data["wish_rank"];
    } else {
	document.getElementById("wish").innerHTML = "";
    }
    if (data.state === 'over') {
	document.getElementById("todo").innerHTML = "Spiel to ende";
	asknewgame(data.players[0].name);
    } else if (data.state === 'passing') {
	if (data.players[0].hand_size === 8) {
	    document.getElementById("todo").innerHTML = "Rest aufheben";

	} else {
	    document.getElementById("todo").innerHTML = "schiebe phase";
	}
    } else if (data['trick_winner'] == 0) {
	if (data.dragon_trick) {
	    document.getElementById("todo").innerHTML = "bomben";
	    document.getElementById("wish").innerHTML = "oder abgeben"
	    addbutton("wish", "links", abgebbutton, "abgebebutton");
	    addbutton("wish", "rechts", abgebbutton, "abgebebutton");
	} else {
	    document.getElementById("todo").innerHTML = "aufheben";
	}
    } else {
	document.getElementById("todo").innerHTML = "legen";
    }
    /* erhaltene karten anmalen bis losgespielt - per log pfui */
    if (lastlogele2 && lastlogele2.text == "You received") {
	addclasstocard(lastlogele2.cards[0], "from-links");
	addclasstocard(lastlogele2.cards[1], "from-partner");
	addclasstocard(lastlogele2.cards[2], "from-rechts");
    } else { /* remove this colors after playing */
	for (let ele of document.getElementsByClassName("from-links"))
	    ele.classList.remove("from-links");
	for (let ele of document.getElementsByClassName("from-partner"))
	    ele.classList.remove("from-partner");
	for (let ele of document.getElementsByClassName("from-rechts"))
	    ele.classList.remove("from-rechts");
    }
}

function dragMoveListener (event) {
    var target = event.target
    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
}

window.dragMoveListener = dragMoveListener
