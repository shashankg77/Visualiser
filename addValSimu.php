<?php
	$link = mysql_connect("localhost", "root", "socAdmin23") or die("Keine Verbindung möglich: " . mysql_error());
	mysql_select_db("SOLIDSimu") or die("Auswahl der Datenbank fehlgeschlagen");

	if(!isset($_REQUEST['machine']) or strlen($_REQUEST['machine']) < 1) die("no machine given");
	if(!isset($_REQUEST['speCount'])) die("no speCount given");

	$insertquery = "INSERT INTO Stats(machine, speCount, time) VALUES('".$_REQUEST['machine']."', '".$_REQUEST['speCount']."', '".$_REQUEST['time']."')";
	echo $insertquery;

	mysql_query($insertquery) or die("Query failed");
	echo "OK! Thanks for the fish";
?>
