



Bot game:

Triggert ein neues spiel:

wget -q -O - --post-data 'name=test&end_score=1000 ' http://localhost:9292/new

in 3 anderen terminals 3 normale bots
python com.py test
python com.py test
python com.py test

danach:
python com.py [player_id - vom wget cmd]



python app.py - start den flask server.


TODO:

beides verbinden